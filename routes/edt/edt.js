const express = require('express');
const router = express.Router();
router.use(express.json());
require('dotenv').config();
const fs = require('fs').promises;
const axios = require('axios');
const cheerio = require('cheerio');
const uniqid = require('uniqid');

const WIGOR_URL = process.env.WIGOR_URL;
const MAX_RETRIES = parseInt(process.env.WIGOR_GET_EDT_MAX_RETRIES, 10) || 3;

async function wigorGetEDT(cookies, date, retries = MAX_RETRIES) {
    try {
        if (cookies) {
            const cookieHeader = cookies.map(cookie => `${cookie.name}=${cookie.value}`).join('; ');

            for (let attempt = 1; attempt <= retries; attempt++) {
                try {
                    const response = await axios.get(`${WIGOR_URL}&date=${date}`, {
                        headers: {
                            'Cookie': cookieHeader
                        }
                    });
                    return response.data;
                } catch (error) {
                    if (error.response && error.response.status === 500) {
                        console.warn(`Attempt ${attempt} failed with status 500. Retrying...`);
                        if (attempt === retries) {
                            console.error('Max retries reached. Giving up.');
                            throw error;
                        }
                    } else {
                        // Non-retryable error, throw it immediately
                        throw error;
                    }
                }
            }
        } else {
            return "error missing cookies";
        }
    } catch (error) {
        console.error('Error in wigorGetEDT:', error);
        return "error";
    }
}

router.post('/', async (req, res) => {
    const date = req.query.date;
    const cookies = req.body.cookies;
    if (cookies && cookies[0].expires > Date.now()) {
        try {
            const edtHTML = await wigorGetEDT(cookies, date);
            const $ = cheerio.load(edtHTML);
            $('style').remove();
            $('script').remove();
            $("img.IMG_Warning").remove();
            const edt = $.html();
            console.log('EDT asked for:', date);
            // Save HTML file in debug_files folder with date as filename (replace / with -) and suffix with a unique id and .html
            // await fs.writeFile(`debug_files/${date.replace(/\//g, '-')}-${uniqid()}.html`, edt);
            res.send(edt);
        } catch (error) {
            console.error('Error in /edt route:', error);
            res.status(500).send('Failed to process request due to internal error');
        }
    } else {
        console.log('Cookies are not valid anymore, please login again.');
        res.status(500).send('Cookies are not valid anymore, please login again.');
    }
});

module.exports = router;
