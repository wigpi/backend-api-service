const express = require('express');
const router = express.Router();
require('dotenv').config();
const fs = require('fs').promises;  // Use promise-based fs
const axios = require('axios');
const cheerio = require('cheerio');
const uniqid = require('uniqid');

const EDT_USERNAME = process.env.EDT_USERNAME;
const EDT_PASSWORD = process.env.EDT_PASSWORD;
const WIGOR_URL = process.env.WIGOR_URL;

async function wigorLogin() {
    try {
        const response = await axios.get("http://localhost:3000/auth", {
            data: {
                username: EDT_USERNAME,
                password: EDT_PASSWORD
            }
        });
        return response.data;
    } catch (error) {
        console.error('Error in wigorLogin:', error);
        throw error;
    }
}

async function wigorGetEDT(cookies, date) {
    try {
        if (cookies) {
            const cookieHeader = cookies.map(cookie => `${cookie.name}=${cookie.value}`).join('; ');
            const response = await axios.get(`${WIGOR_URL}&date=${date}`, {
                headers: {
                    'Cookie': cookieHeader
                }
            });
            return response.data;
        } else {
            return "error";
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
            // using cheerio, remove any style tags from the html and script tags
            const $ = cheerio.load(edtHTML);
            $('style').remove();
            $('script').remove();
            $("img.IMG_Warning").remove();
            const edt = $.html();
            console.log('EDT asked for:', date);
            // save html file in debug_files folder with date as filename (replace / with - to avoid path issues) and suffix with a unique id and .html
            // await fs.writeFile(`debug_files/${date.replace(/\//g, '-')}-${uniqid()}.html`, edt);
            res.send(edt);
        } catch (error) {
            console.error('Error in /edt route:', error);
            res.status(500).send('Failed to process request due to internal error');
        }
    }else{
            console.log(req.body);
            res.status(500).send('Cookies are not valid anymore, please login again.');
    }
});

module.exports = router;