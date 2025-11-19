const sharp = require('sharp');

exports.handler = async (event) => {
    console.log('Evento recibido:', JSON.stringify(event));
    
    try {
        const text = event.text || 'Laravel + Lambda';
        const width = parseInt(event.width) || 800;
        const height = parseInt(event.height) || 600;
        
        console.log(`Creando imagen: ${text} (${width}x${height})`);
        
        // Crear imagen SVG simple
        const svg = `
            <svg width="${width}" height="${height}">
                <rect width="100%" height="100%" fill="#2563eb"/>
                <text x="50%" y="50%" font-family="Arial" font-size="30" fill="white" text-anchor="middle" dy=".3em">${text}</text>
                <text x="50%" y="60%" font-family="Arial" font-size="16" fill="white" text-anchor="middle">AWS Lambda + Sharp</text>
            </svg>
        `;
        
        // Convertir SVG a PNG usando Sharp
        const imageBuffer = await sharp(Buffer.from(svg))
            .png()
            .toBuffer();
        
        // Convertir a base64 para devolver en la respuesta
        const base64Image = imageBuffer.toString('base64');
        
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                success: true,
                message: '¡Imagen creada con Sharp!',
                text: text,
                image_size: `${width}x${height}`,
                image_data: base64Image,
                image_format: 'PNG',
                file_size: `${imageBuffer.length} bytes`,
                sharp_working: true,
                timestamp: new Date().toISOString()
            })
        };
        
    } catch (error) {
        console.error('Error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({
                success: false,
                error: error.message,
                message: 'Error procesando imagen'
            })
        };
    }
};