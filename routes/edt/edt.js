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
    if (!cookies?.length) {
        throw new Error('Missing cookies');
    }

    const cookieHeader = cookies.map(cookie => `${cookie.name}=${cookie.value}`).join('; ');

    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            const response = await axios.get(`${WIGOR_URL}&date=${date}`, {
                headers: { 'Cookie': cookieHeader }
            });
            return response.data;
        } catch (error) {
            if (error.response?.status === 500 && attempt < retries) {
                console.warn(`Attempt ${attempt} failed. Retrying...`);
            } else {
                throw error;
            }
        }
    }
    throw new Error('Max retries reached');
}

async function cleanHTML(html) {
    const $ = cheerio.load(html);
    $('style, script, img.IMG_Warning').remove();
    return $.html();
}

router.post('/', async (req, res) => {
    const { date } = req.query;
    const { cookies } = req.body;

    if (!date || !cookies?.length || cookies[0]?.expires <= Date.now()) {
        console.log('Invalid cookies or date. Please login again.');
        return res.status(400).send('Invalid cookies or date. Please login again.');
    }

    try {
        const edtHTML = await wigorGetEDT(cookies, date);
        const cleanedHTML = await cleanHTML(edtHTML);
        console.log('EDT requested for:', date);

        // Uncomment the next line to enable saving for debugging purposes
        // await fs.writeFile(`debug_files/${date.replace(/\//g, '-')}-${uniqid()}.html`, cleanedHTML);

        res.send(cleanedHTML);
    } catch (error) {
        console.error('Error processing /edt request:', error.message);
        res.status(500).send('Failed to process request due to an internal error');
    }
});

module.exports = router;
