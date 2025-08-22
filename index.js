const { log } = require('console');
const express = require('express');
const multer = require('multer');
const app = express();
const hbs = require('hbs');
const path = require('path');
const dotenv = require('dotenv');
const {BlobServiceClient} = require('@azure/storage-blob')

dotenv.config();
const port = process.env.PORT || 3000;
const viewsPath = path.join(__dirname, '/templates/views');
const partialsPath = path.join(__dirname, '/templates/component');

const sas = process.env.SAS_TOKEN;
const account = process.env.STORAGE_ACCOUNT_NAME;
const container = process.env.CONTAINER_NAME;


const storage = multer.memoryStorage();

const upload = multer({ storage: storage })

const blobServiceClient = new BlobServiceClient(`https://${account}.blob.core.windows.net/?${sas}`);

const containerServiceClient = blobServiceClient.getContainerClient(container);

// Set up view engine
app.set('view engine', 'hbs');
app.set('views', viewsPath);
hbs.registerPartials(partialsPath);

app.use(express.static('public'));



app.get('/', (req, res) => {
    res.render('index', {
        data: {
            title: "Upload Image"
        }
    });
});

app.post('/upload', upload.single('image'), async (req, res) => {
  if (!req.file) {
    return res.status(400).send('No file uploaded');
  }else{
    try {
      const blobName = req.file.originalname + Date.now();
      const blobBlobClient = containerServiceClient.getBlockBlobClient(blobName);
      const blobupload = await blobBlobClient.upload(req.file.buffer, req.file.size);

      res.status(200).send('File uploaded successfully!');

    } catch (error) {
      console.log("Error" + error)
    }
    console.log('File uploaded successfully:', req.file.filename);
  }
});

app.get('/view', async (req, res) => {
  let images = [];
  const blobList = containerServiceClient.listBlobsFlat();
  for await(const blob of blobList){
    images.push(`https://${account}.blob.core.windows.net/${container}/${blob.name}?${sas}`);
  }
  
  res.render('viewImage', {
    data: {
      title: "View Image",
      images: images
    }
  })
});


app.get("/:any", (req, res) => {
    res.render('404', {
        data: {
            title: "404 Not Found"
        }
    });
});


app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});