const path = require('path')
const fs = require('fs')
const mime = require('mime-types')

const { google } = require('googleapis')
const apiKey = require('../ServiceAccountKey.json')

const SCOPES = ['https://www.googleapis.com/auth/drive', 'https://www.googleapis.com/auth/documents']

const privateKey = process.env.DRIVE_PRIVATE_KEY.split(String.raw`\n`).join('\n')
const clientEmail = process.env.DRIVE_CLIENT_EMAIL


async function authorize() {

    const jwtclient = new google.auth.JWT(
        clientEmail,
        null,
        privateKey,
        SCOPES,
    )

    await jwtclient.authorize()

    return jwtclient
}

async function createUploadFile(filePath, parentId) {
    try {

        const auth = await authorize();

        const drive = google.drive({
            version: 'v3',
            auth,
        })

        console.log(filePath)

        // const parentId = '1I595ATgfgpw9cwsgi76XBjZa-kE8KYU7'//folder ID
        // const filePath = 'Sniper business center contacts.vcf'

        const fileName = path.basename(filePath)
        const mimeType = mime.lookup(fileName) || 'application/octet-stream'

        const fileMetaData = {
            name: fileName,
            parents: [parentId],
        }

        const media = {
            body: fs.createReadStream(filePath),
            mimeType: mimeType,
        }

        const response = await drive.files.create({
            resource: fileMetaData,
            media: media,
            fields: 'id',
        })

        if (response.status) {
            console.log('File created. id: ', response.data.id)
            return response.data.id
        } else {
            console.error('Error creating file, ' + response.errors)
        }

    } catch (error) {
        console.log('error: ' + error)
    }
}

async function updateFile(filePath, fileId) {
    try {
        const auth = await authorize()

        const drive = google.drive({
            version: 'v3',
            auth,
        })

        // const filePath = 'Sniper business center contacts.vcf'
        // const fileId = '1ZmO44mTi9rXOqIXQRFKs6ye4WFQBHG-A'

        const fileName = path.basename(filePath)
        const mimeType = mime.lookup(fileName) || 'application/octet-stream'

        const media = {
            mimeType: mimeType,
            body: fs.createReadStream(filePath),
        }

        const response = await drive.files.update({
            fileId: fileId,
            media: media,
        })


        switch (response.status) {
            case 200:
                console.log('File Updated. id: ', response.data.id)
                break
            default:
                console.error('Error creating file, ' + response.errors)
                break
        }
    } catch (error) {
        console.log('error: ' + error)
    }
}

async function deleteDriveFile(fileId) {
    try {
        const auth = await authorize()

        const drive = google.drive({
            version: 'v3',
            auth,
        })

        const response = await drive.files.update({ fileId, resource: { trashed: true } })

        switch (response.status) {
            case 200:
                console.log('File deleted to trash. id: ', response.data.id)
                break
            default:
                console.error('Error creating file, ' + response.errors)
                break
        }
    } catch (error) {
        console.log('error: ' + error)
    }
}

async function downloadFile(filePath, fileId) {
    const fs = require('fs').promises

    try {
        const auth = await authorize()

        const drive = google.drive({
            version: 'v3',
            auth,
        })

        // const filePath = 'testing-contacts.vcf'
        // const fileId = '1ZmO44mTi9rXOqIXQRFKs6ye4WFQBHG-A'

        const response = await drive.files.get({ fileId: fileId, alt: 'media' }, { responseType: "arraybuffer" })



        switch (response.status) {
            case 200:

                // Write data to the file
                const dataToWrite = response.data;

                // Create directory
                const directory = path.dirname(filePath)
                await fs.mkdir(directory, { recursive: true })

                // Savefile to dir
                await fs.writeFile(filePath, Buffer.from(dataToWrite), 'utf8')

                console.log('Data has been written to the file successfully.')


                return filePath; 

            default:
                console.error('Error Downloading file, ' + response.errors)

                return null
        }

    } catch (error) {
        console.log(error)
        return null
    }
}

module.exports = {
    createUploadFile,
    updateFile,
    deleteDriveFile,
    downloadFile,
}


