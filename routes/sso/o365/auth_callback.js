const express = require('express');
const router = express.Router();
require('dotenv').config();
const qs = require('qs');
const axios = require('axios');

const clientId = process.env.AZURE_CLIENT_ID;
const clientSecret = process.env.AZURE_CLIENT_SECRET;
const tenantId = 'common';
const redirectUri = 'https://edt_test.flusin.fr/auth/callback';

const getAccessToken = async (code) => {
    const tokenResponse = await axios.post(`https://login.microsoftonline.com/common/oauth2/v2.0/token`, qs.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: redirectUri,
        scope: 'openid profile User.Read'
    }));
    return tokenResponse.data.access_token;
};

const userInfos = async (accessToken) => {
    const userInfosResponse = await axios.get('https://graph.microsoft.com/v1.0/me', {
        headers: {
            'Authorization': `Bearer ${accessToken}`
        }
    });

    const userInfos = userInfosResponse.data;
    return userInfos;
};

const getUserGroups = async (accessToken) => {
    const groupsResponse = await axios.get('https://graph.microsoft.com/v1.0/me/memberOf', {
        headers: {
            'Authorization': `Bearer ${accessToken}`
        }
    });

    const userGroups = groupsResponse.data.value;
    return userGroups;
};

router.get('/callback', async (req, res) => {
    const code = req.query.code;

    try {
        const accessToken = await getAccessToken(code);
        const userInfo = await userInfos(accessToken);
        $user_data = {
            "displayName": userInfo.displayName,
            "givenName": userInfo.givenName,
            "surname": userInfo.surname,
            "id": userInfo.id,
            "userPrincipalName": userInfo.userPrincipalName,
            "officeLocation": userInfo.officeLocation,
        }
        res.json($user_data);
        console.log($user_data);
        console.log('User infos:', userInfo);
    } catch (error) {
        console.error('Error in /auth/callback route:', error);
        res.status(500).send('Failed to process request due to internal error');
    }
});

// add a get route for this https://edt_test.flusin.fr/.well-known/microsoft-identity-association.json
// router.get('/.well-known/microsoft-identity-association.json', async (req, res) => {
//     res.json({
//         "associatedApplications": [
//           {
//             "applicationId": "753540a7-c68a-45f1-82b8-409406025913"
//           }
//         ]
//       });
// });

module.exports = router;