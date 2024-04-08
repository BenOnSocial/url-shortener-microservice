require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const bodyParser = require("body-parser");
const dns = require('dns');

// Basic Configuration
const port = process.env.PORT || 3000;

const mongoose = require('mongoose');
const Schema = mongoose.Schema;
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true });

const shortUrlSchema = new Schema({
  original_url: { type: String, required: true }
});

const ShortUrl = mongoose.model("ShortUrl", shortUrlSchema);

app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function (req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function (req, res) {
  res.json({ greeting: 'hello API' });
});


app.get('/api/shorturl/:code', async (req, res) => {
  const shortUrl = await ShortUrl.findById(req.params.code);
  if (shortUrl) {
    res.redirect(shortUrl.original_url);
  }
});

app.use(bodyParser.urlencoded({ extended: false }));

app.post('/api/shorturl', (req, res) => {
  try {
    console.log(`Validating ${req.body.url}`);

    const url = new URL(req.body.url);

    console.log("Good URL");

    dns.lookup(url.hostname, async (err, address, family) => {
      if (err) {
        res.json({ error: "invalid url" });
      }

      console.log(`Good DNS: ${address}`);

      console.log(`Lookup ${url.href}`);
      const existingUrl = await ShortUrl.findOne({ original_url: url.href });
      if (existingUrl) {
        console.log(`Found existing URL ${existingUrl}`);
        res.json({
          original_url: existingUrl.original_url,
          short_url: existingUrl._id
        });
      } else {
        console.log(`Saving ${url.href}`);

        const shortUrl = await ShortUrl.create({
          original_url: url.href
        });

        console.log(`Saved ${url.href}`);

        res.json({
          original_url: shortUrl.original_url,
          short_url: shortUrl._id
        });
      }
    });
  } catch (err) {
    res.json({ error: "invalid url" });
  }
});


app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});
