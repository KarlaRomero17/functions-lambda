// Este archivo index.mjs implementa una función AWS Lambda llamada lamp-lambda-demo

import { S3Client, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";

const s3Client = new S3Client({ region: "us-east-1" });

export const handler = async (event) => {
    console.log('Evento recibido en image-processor:', JSON.stringify(event, null, 2));
    
    try {
        // Si viene de API Gateway (pruebas directas)
        if (event.text) {
            const text = event.text || 'Texto de prueba';
            const action = event.action || 'uppercase';
            
            let result;
            switch(action) {
                case 'uppercase':
                    result = text.toUpperCase();
                    break;
                case 'reverse':
                    result = text.split('').reverse().join('');
                    break;
                case 'count':
                    result = `Tiene ${text.length} caracteres`;
                    break;
                case 'words':
                    result = `Tiene ${text.split(' ').length} palabras`;
                    break;
                default:
                    result = `Procesado: ${text}`;
            }
            
            return {
                statusCode: 200,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({
                    success: true,
                    input: text,
                    action: action,
                    result: result,
                    processed_by: 'AWS Lambda image-processor',
                    timestamp: new Date().toISOString(),
                    message: '¡Procesamiento de texto exitoso!'
                })
            };
        }
        
        // Si viene de S3 (procesamiento de imágenes)
        if (event.Records && event.Records[0].eventSource === 'aws:s3') {
            const bucket = event.Records[0].s3.bucket.name;
            const key = decodeURIComponent(event.Records[0].s3.object.key.replace(/\+/g, ' '));
            
            console.log(`🖼️ Procesando imagen de S3: ${key} del bucket: ${bucket}`);
            
            // Solo procesar archivos en uploads/
            if (!key.startsWith('uploads/')) {
                console.log('❌ Archivo no está en uploads/, ignorando...');
                return { status: 'skipped' };
            }
            
            // SIMULAR procesamiento de imagen (MUY RÁPIDO)
            const fileName = key.split('/').pop();
            const newKey = `processed/${fileName.split('.')[0]}_processed.jpg`;
            
            console.log(`⚡ Procesando: ${key} a: ${newKey}`);
            
            // SOLO 500ms de simulación (en lugar de 2 segundos)
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Crear archivo de resultado simulado
            const processedContent = JSON.stringify({
                original_file: key,
                processed_file: newKey,
                processed_at: new Date().toISOString(),
                processing_time: '0.5 segundos',
                simulation: true,
                message: 'Procesamiento simulado exitoso',
                bucket: bucket,
                lambda_function: 'image-processor',
                status: 'completed'
            }, null, 2);
            
            // Guardar resultado en S3
            await s3Client.send(new PutObjectCommand({
                Bucket: bucket,
                Key: newKey,
                Body: processedContent,
                ContentType: 'application/json',
                Metadata: {
                    'processed-by': 'aws-lambda',
                    'original-file': key,
                    'lambda-function': 'image-processor'
                }
            }));
            
            console.log(`✅ Procesamiento completado: ${newKey}`);
            
            return {
                statusCode: 200,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    success: true,
                    message: 'Procesamiento de imagen simulado exitoso',
                    original: key,
                    processed: newKey,
                    bucket: bucket,
                    processing_time: '0.5 segundos',
                    timestamp: new Date().toISOString(),
                    lambda_function: 'image-processor',
                    s3_url: `https://${bucket}.s3.us-east-1.amazonaws.com/${newKey}`
                })
            };
        }
        
        // Si no coincide con ningún patrón conocido
        return {
            statusCode: 400,
            body: JSON.stringify({
                success: false,
                message: 'Evento no reconocido',
                suggestion: 'Usa {text: "texto"} para pruebas o sube archivos a S3'
            })
        };
        
    } catch (error) {
        console.error('❌ Error en image-processor:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({
                success: false,
                error: error.message,
                lambda_function: 'image-processor'
            })
        };
    }
};