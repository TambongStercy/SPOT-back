const fs = require('fs');

const sharp = require("sharp");
const util = require('util');

// Promisify the toBuffer method
const toBufferAsync = util.promisify(sharp().toBuffer);


function readFile(path) {
    return new Promise((resolve, rejects) => {
        fs.readFile(path, (err, data) => {
            if (err) {
                rejects("not found");
            } else {
                resolve(data);
            }
        });
    });
}

async function addBluredFrameBuffer(message) {

    const type = message.type;


    if (type == 'text') {
        return message;
    }

    console.log('type: ' + type);


    try {
        const path = '.' + message.file.path;
        const bluredFramePath = await getBlurFrame(path, type) ?? '';
        const imageBuffer = bluredFramePath ? await fs.promises.readFile(bluredFramePath) : null;
        deleteFile(bluredFramePath);
        message.bluredFrame = imageBuffer ? imageBuffer.toString('base64') : null;

    } catch (error) {
        console.log(err);
    }


    return message;
}

async function imageToBluredBuffer(path) {
    const type = 'image';
    console.log('yes');
    try {
        console.log('1');

        const bluredFramePath = await resizeImage(path) ?? '';
        console.log('2');
        const imageBuffer = bluredFramePath ? await fs.promises.readFile(bluredFramePath) : null;
        console.log('3');
        deleteFile(bluredFramePath);
        console.log('4');
        return imageBuffer ? imageBuffer.toString('base64') : null;
    } catch (error) {
        console.log(err);
    }

}

async function videoFirstFrame(videoPath) {
    // const timestamp = Date.now(); // Generate a unique timestamp
    // const frameFilepath = `frames/frame_${timestamp}.png`; // Unique frame filename
    // console.log('video: ' + videoPath);
    // return new Promise((resolve, reject) => {
    //     ffmpeg()
    //         .input(videoPath)
    //         .frames(1) // Capture only the first frame
    //         .output(frameFilepath)
    //         .on('end', () => {
    //             console.log('First frame captured successfully.');
    //             resolve(frameFilepath);
    //         })
    //         .on('error', (err) => {
    //             console.error('Error capturing the first frame:', err);
    //             reject(err);
    //         })
    //         .run();
    // });
}

async function resizeBlurImage(imagePath) {
    try {
        console.log(imagePath);
        const parts = imagePath.split('_');
        const timestampString = parts[1].split('.')[0];
        const outputPath = `frames/image_blurred_${timestampString}.jpg`;

        const metadata = await sharp(imagePath).metadata();

        const resizedWidth = Math.round(metadata.width * 0.3);
        const resizedHeight = Math.round(metadata.height * 0.3);

        await sharp(imagePath)
            .resize({
                width: resizedWidth,
                height: resizedHeight,
            })
            .blur(4)
            .toFile(outputPath);

        console.log('successfull');


        return outputPath;

    } catch (error) {
        console.log(error);
    }
}

async function resizeImage(imagePath) {
    try {
        console.log(imagePath);
        const outputPath = `frames/image_blurred_test.jpg`;


        const metadata = await sharp(imagePath).metadata();

        const resizedWidth = Math.round(metadata.width * 0.08);
        const resizedHeight = Math.round(metadata.height * 0.08);

        await sharp(imagePath)
            .resize({
                width: resizedWidth,
                height: resizedHeight,
            })
            .toFile(outputPath);

        console.log('successfull');

        return outputPath;

    } catch (error) {
        console.log(error);
    }
}

async function getBlurFrame(path, type) {
    try {

        if (type == 'image' || type == 'video') {
            const framePath = type == 'image' ? path : await videoFirstFrame(path);

            const blurImage = await resizeBlurImage(framePath);

            console.log(`blur was saved at ${blurImage} and will be deleted after being sent to chat`);

            return blurImage;
        }

        return null;
    } catch (error) {
        console.log(err);
    }

}


// This function encodes an image file as a Base64 string
async function encodeImageBase64(path) {

    // Read the image file as a buffer
    const imageBuffer = fs.readFileSync("." + path);

    // Encode the image buffer as a Base64 string
    const imageBase64 = Buffer.from(imageBuffer).toString('base64');

    // Return the Base64 string
    return imageBase64;

}

function deleteFile(filePath) {
    fs.unlink(filePath, (err) => {
        if (err) {
            console.error('Error deleting file:', err);
        } else {
            console.log('File deleted successfully. ');
        }
    });
}


function doesFileExist(filePath) {
    try {
        // Use fs.statSync to get information about the file
        fs.statSync(filePath);
        return true; // If successful, the file exists
    } catch (error) {
        if (error.code === 'ENOENT') {
            return false; // File does not exist
        } else {
            throw error; // Other error (e.g., permission issues)
        }
    }
}

async function resizeImageToBuffer(imagePath) {
    try {
        console.log(imagePath);

        if (!imagePath || imagePath == '') {
            return '';
        }

        if(!doesFileExist(imagePath)){
            console.log('this path does not exist becs of render\'s temporal disk')
            return '';
        }

        const outputPath = `frames/image_blurred_test.jpg`;


        const metadata = await sharp(imagePath).metadata();

        const resizedWidth = Math.round(metadata.width * 0.08);
        const resizedHeight = Math.round(metadata.height * 0.08);


        await sharp(imagePath)
            .resize({
                width: resizedWidth,
                height: resizedHeight,
            })
            .toFile(outputPath);


        const imageBuffer = await fs.promises.readFile(outputPath);
        // console.log(imageBuffer);
        return  imageBuffer.toString('base64') ;
        // deleteFile(outputPath);

        




    } catch (error) {
        console.log(error);
        return '';
    }
}


module.exports = {
    readFile,
    addBluredFrameBuffer,
    videoFirstFrame,
    resizeBlurImage,
    getBlurFrame,
    deleteFile,
    imageToBluredBuffer,
    encodeImageBase64,
    resizeImageToBuffer,
};
