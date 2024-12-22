const multer = require('multer');
          const { GoogleGenerativeAI } = require("@google/generative-ai");
          const storage = multer.memoryStorage();
          const upload = multer({ storage });
          
          // Initialize Google Generative AI
          const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
          
          // Middleware to handle multipart form data
          const multerHandler = upload.single('image');
          
          exports.handler = async (event, context) => {
            if (event.httpMethod !== 'POST') {
              return {
                statusCode: 405,
                body: JSON.stringify({ error: 'Method not allowed' })
             };
            }
          
            try {
              const { file, error } = await new Promise((resolve) => {
                const req = {
                  headers: event.headers,
                  body: Buffer.from(event.body, 'base64')
                };
                
                const res = {};
                
                multerHandler(req, res, (err) => {
                  if (err) {
                    resolve({ error: err });
                  } else {
                   resolve({ file: req.file });
                  }
                });
              });
          
              if (error) {
                return {
                  statusCode: 400,
                 body: JSON.stringify({ error: 'Error processing file upload' })
                };
              }
          
              if (!file) {
                return {
                  statusCode: 400,
                  body: JSON.stringify({ error: 'No image file uploaded' })
                };
              }
          
              const imageData = file.buffer.toString('base64');
          
              const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
              const result = await model.generateContent([
                "Analyze this plant image and provide detailed analysis of its species, health, and care recommendations, its characteristics, care instructions, and any interesting facts. Please provide the response in plain text without using any markdown formatting.",
                {
                  inlineData: {
                   mimeType: file.mimetype,
                    data: imageData,
                  },
                },
              ]);
          
              const plantInfo = result.response.text();
          
              return {
                statusCode: 200,
                body: JSON.stringify({
                  result: plantInfo,
                  image: `data:${file.mimetype};base64,${imageData}`
               })
              };
            } catch (error) {
              console.error('Error analyzing image:', error);
              return {
                statusCode: 500,
                body: JSON.stringify({ error: 'An error occurred while analyzing the image' })
              };
            }
  };