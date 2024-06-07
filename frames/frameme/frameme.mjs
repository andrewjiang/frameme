import express from 'express';
import sharp from 'sharp';
import path from 'path';
import TextToSVG from 'text-to-svg';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { NeynarAPIClient } from "@neynar/nodejs-sdk";
import { InfuraProvider } from 'ethers/providers';
import { init } from "@airstack/node";
import { fetchQuery } from "@airstack/node";
import dotenv from 'dotenv';
import shortid from 'shortid';
import pkg  from 'pg';

// CLIENT: HEROKU POSTGRESS ACCESS
const { Pool } = pkg;
const db = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// CLIENT: NEYNAR API ACCESS
const neynar = new NeynarAPIClient(process.env.NEYNAR_API_KEY);
init(process.env.AIRSTACK_API_KEY);

// LOCAL ENV ACCESS
const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../../.env.local') });

// OTHER INIT VARIABLES
const stateStorage = {};
const textToSVG = TextToSVG.loadSync('./Avantt-SemiBold.ttf');
const textToSVG2 = TextToSVG.loadSync('./Avantt-Regular.ttf');


// Create a router
const router = express.Router();

// Base strings
// Base url is the root domain of the server or localhost if developing locally
const base_url = process.env.NODE_ENV === 'production' ? "https://frameme.xyz/" : "http://localhost:3001/";

const base_img_url = base_url+"static/frameme/images/";
let successImgUrl = base_img_url + "5_success.png";  
let failImgUrl = base_img_url + "5_error.png";

const base_api_url = base_url + "frameme/";
const starterFrame = (initImage = {}) => {
    // Set the default image URL if initImage is not provided
    console.log("initImage:", initImage)
    
    const initImageUrl = base_api_url + `image?f=1&o=${initImage.o}&t1=${encodeURIComponent(initImage.t1)}&t2=${encodeURIComponent(initImage.t2)}`;
    console.log("initImageUrl:", initImageUrl);
    
    const imageUrl = initImage.o ? initImageUrl : `${base_img_url}0.gif`;
    
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Frameme</title>
            <!-- Farcaster Frame Metadata -->
            <meta property="fc:frame" content="vNext" />
            <meta property="fc:frame:image" content="${imageUrl}" />
            <meta property="fc:frame:image:aspect_ratio" content="1:1" />
            <meta property="og:image" content="${imageUrl}" />
            <meta property="fc:frame:button:1" content="${initImage.o ?"Mint Your Own Meme" : "Get Started"}" />            
            <meta property="fc:frame:post_url" content="${base_api_url}step1" />
            <!-- <meta http-equiv="refresh" content="0; URL=https://explore.curated.xyz/" /> -->
            
        </head>
        <body style="background-color:black">
        Frameme Maker
        <img src="${imageUrl}" alt="Frameme Maker" style="display: block; margin-left: auto; margin-right: auto; width: 50%;">
        </body>
        </html>
    `;
}
const laterFrame = () => {
  
    const imageUrl = `${base_img_url}oops.png`

    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Frameme</title>
            <!-- Farcaster Frame Metadata -->
            <meta property="fc:frame" content="vNext" />
            <meta property="fc:frame:image" content="${imageUrl}" />
            <meta property="fc:frame:image:aspect_ratio" content="1:1" />
            <meta property="og:image" content="${imageUrl}" />
            <meta property="fc:frame:button:1" content="Follow @ok" />
            <meta property="fc:frame:button:1:action" content="link" />
            <meta property="fc:frame:button:1:target" content="https://warpcast.com/ok";>
            
            
            <!-- <meta http-equiv="refresh" content="0; URL=https://explore.curated.xyz/" /> -->
            
        </head>
        <body style="background-color:black">
        Cupid's Frame
        <img src="${imageUrl}" alt="Cupid's Frame" style="display: block; margin-left: auto; margin-right: auto; width: 50%;">
        </body>
        </html>
    `;
}
const errorFrame = `<!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Frameme</title>
        <!-- Farcaster Frame Metadata -->
        <meta property="fc:frame" content="vNext" />
        <meta property="fc:frame:image" content="${base_img_url}0.png" />
        <meta property="fc:frame:image:aspect_ratio" content="1:1" />
        <meta property="og:image" content="${base_img_url}0.png" />
        <meta property="fc:frame:button:1" content="Oops, let's try again!" />
        <meta property="fc:frame:post_url" content="${base_api_url}step1" />
        <!-- <meta http-equiv="refresh" content="0; URL=https://explore.curated.xyz/" /> -->
        
    </head>
    <body style="background-color:black">
    Cupid's Frame
    <img src="https://cupidsframe.vercel.app/1_start.png" alt="Cupid's Frame" style="display: block; margin-left: auto; margin-right: auto; width: 50%;">
    </body>
    </html>
`
const frameStructure = (imageUrl, postUrl, inputHTML) => {
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta property="fc:frame" content="vNext" />
            <meta property="fc:frame:image" content="${imageUrl}" />
            <meta property="fc:frame:image:aspect_ratio" content="1:1" />
            <meta property="og:image"  content="${imageUrl}" />
            ${inputHTML}
            <meta property="fc:frame:post_url" content="${postUrl}" />
        </head>
        <body>
        </body>
        </html>
    `
}

// Define a meme class that has a title and a list of text fields with xy coordinates for the bounds of the text fields
const memes = [
    {
        id: 1,
        title: "Drake",
        font:
            {
                fontFamily: "Avant Garde",
                fontWeight: "bold",
                fontSize: 100,
                fontColor: "black",
            },
        textFields: [
            {
                x: 800,
                y: 40,
                width: 660,
                height: 640
            },
            {
                x: 800,
                y: 750,
                width: 660,
                height: 750
            }
        ]
    }, {
        id: 2,
        title: "Bernie",
        font:
        {
            fontFamily: "Avant Garde",
            fontWeight: "bold",
            fontSize: 100,
            fontColor: "white",
        },
        textFields: [
            {
                x: 75,
                y: 1300,
                width: 1350,
                height: 160
            }
        ]
    }, {
        id: 3,
        title: "Change My Mind",
        font:
            {
                fontFamily: "Avant Garde",
                fontWeight: "bold",
                fontSize: 100,
                fontColor: "black",
            },
        textFields: [
            {
                x: 520,
                y: 920,
                width: 800,
                height: 280
            }
        ]
    }, {
        id: 4,
        title: "Side Eye Teddy",
        font:
            {
                fontFamily: "Avant Garde",
                fontWeight: "bold",
                fontSize: 100,
                fontColor: "black",
            },
        textFields: [
            {
                x: 50,
                y: -50,
                width: 1400,
                height: 700
            }
        ]
    }, {
        id: 5,
        title: "Is This A Meme",
        font:
            {
                fontFamily: "Avant Garde",
                fontWeight: "bold",
                fontSize: 100,
                fontColor: "white",
                stroke: "black",
                strokeWidth: 3
            },
        textFields: [
            {
                x: 1000,
                y: 130,
                width: 400,
                height: 400
            },
            {
                x: 100,
                y: 930,
                width: 1300,
                height: 480
            }
        ]
    }, {
        id: 6,
        title: "Night Club Girl",
        font:
            {
                fontFamily: "Avant Garde",
                fontWeight: "bold",
                fontSize: 100,
                fontColor: "white",
                stroke: "black",
                strokeWidth: 3
            },
        textFields: [
            {
                x: 100,
                y: 700,
                width: 1300,
                height: 700
            }
        ]
    }, {
        id: 7,
        title: "Worst Day So Far Meme",
        font:
            {
                fontFamily: "Avant Garde",
                fontWeight: "bold",
                fontSize: 100,
                fontColor: "white",
                stroke: "black",
                strokeWidth: 2
            },
        textFields: [
            {
                x: 100,
                y: 580,
                width: 1300,
                height: 150
            },
            {
                x: 100,
                y: 1300,
                width: 1300,
                height: 180
            },            
        ]
    },{
        id: 8,
        title: "Ben Affleck",
        font:
            {
                fontFamily: "Avant Garde",
                fontWeight: "bold",
                fontSize: 100,
                fontColor: "black"
            },
        textFields: [
            {
                x: 50,
                y: 50,
                width: 1400,
                height: 300
            }
        ]
    },{
        id: 9,
        title: "TYBG",
        font:
            {
                fontFamily: "Avant Garde",
                fontWeight: "bold",
                fontSize: 100,
                fontColor: "black",
                stroke: "white",
                strokeWidth: 3
            },
        textFields: [
            {
                x: 100,
                y: 1000,
                width: 1300,
                height: 500
            }
        ]
    },{
        id: 10,
        title: "Big Dog",
        font:
            {
                fontFamily: "Avant Garde",
                fontWeight: "bold",
                fontSize: 100,
                fontColor: "black"
            },
        textFields: [
            {
                x: 50,
                y: 50,
                width: 1400,
                height: 250
            }
        ]
    }
]

async function createShortUrl(longUrl) {
    const shortUrlId = shortid.generate();
   
    const client = await db.connect();
    try {
      await client.query('INSERT INTO url_mappings (short_id, long_url) VALUES ($1, $2)', [shortUrlId, longUrl]);
    } finally {
      client.release();
    }
  
    return shortUrlId;
}

router.get('/metadata', async (req, res) => {
    
    const username = req.query.username;
    const s = req.query.s;
    const o = req.query.o;

    console.log("Metadata for:", username);

    const longUrl = await getLongUrl(s);
    // replace /share with /image
    console.log("longUrl:", longUrl);
    const imageUrl = longUrl.replace("/share?", "/image?f=1&");
    console.log("imageUrl:", imageUrl);
    
    res.send({
        name: `Frameme by @${username}`,
        description: "Make your own frameme!",
        image: imageUrl,
        attributes: [
            {
                trait_type: "Collection",
                value: "Frameme"
            },
            {
                trait_type: "Meme",
                value: memes[o-1].title
            }
        ]
    });
});

// function to get the long URL from the short URL ID
async function getLongUrl(shortUrlId) {
    const client = await db.connect();
    try {
        const result = await client.query('SELECT long_url FROM url_mappings WHERE short_id = $1', [shortUrlId]);
        if (result.rows.length > 0) {
            return result.rows[0].long_url;
        } else {
            return null;
        }
    } finally {
        client.release();
    }
}

router.get('/id/:shortUrlId', async (req, res) => {
    const { shortUrlId } = req.params;

    const longUrl = await getLongUrl(shortUrlId);
    if (longUrl) {
        res.redirect(longUrl);
    } else {
        res.send(starterFrame());
    }
});

const syndicateActionRes = async function(
    frameTrustedData,
    contractAddress,
    functionSignature,
    args,
    shouldLike = false,
    shouldRecast = false,
    shouldFollow = false
  ) {
    const response = await fetch('https://frame.syndicate.io/api/v2/sendTransaction', {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.SYNDICATE_FRAMEME_API_KEY}`
      },
      body: JSON.stringify({
        frameTrustedData,
        contractAddress,
        functionSignature,
        args,
        shouldLike,
        shouldRecast,
        shouldFollow
      })
    });
  
    console.log("syndicateActionRes:", response);
    return await response.json();
}
  
  const checkENSName = async function(str) {
    try {
        const provider = new InfuraProvider('mainnet');
        const address = await provider.resolveName(str);
        return address;
    } catch (error) {
        console.error(error);
        return null;
    }
}
// Function that checks a string and determines whether it's an @username, an ENS name, or a 0x-prefixed Ethereum address
const checkStringType = async function(str) {
    if (str.startsWith('@')) {
        console.log("Sending To WC Username");
        // Pull username from string
        const username = str.slice(1);
        const lookupUsername = await neynar.lookupUserByUsername(username)
        const verifiedAddress = lookupUsername.result.user.verifications[0];
        return verifiedAddress;
    } else if (str.startsWith('0x')) {
        return str;
    } else {
        // Check if the string is a valid ENS name and get address
        return await checkENSName(str).then((address) => {
            if(address){
                return address;
            } else {
                return false;
            }
        });
    }
}

function fitTextToArea(text, textField, meme, textToSVG) {
    let fontSize = meme.font.fontSize;
    let fontFamily = meme.font.fontFamily;
    let fontWeight = meme.font.fontWeight;
    let fontColor = meme.font.fontColor;
    let stroke = meme.font.stroke ? `stroke="${meme.font.stroke}" stroke-width="${meme.font.strokeWidth}"` : '';

    let lines = [];
    let textWidth;
    let textHeight;

    // Split text into words
    let words = text.split(' ');

    // Determine the number of lines needed based on the character limit
    let charsPerLine = 50;
    let numLines = Math.ceil(text.length / charsPerLine);

    // Distribute words evenly across the lines
    let wordsPerLine = Math.ceil(words.length / numLines);
    for (let i = 0; i < words.length; i += wordsPerLine) {
        let line = words.slice(i, i + wordsPerLine).join(' ');
        lines.push(line);
    }

    // Reduce font size until all lines of text fit within the text area
    do {
        fontSize--;
        textHeight = 0;
        textWidth = 0;

        for (let line of lines) {
            const metrics = textToSVG.getMetrics(line, {
                fontSize,
                anchor: 'top',
                fontFamily,
                fontWeight,
                fontColor,
                stroke
            });
            textWidth = Math.max(textWidth, metrics.width);
            textHeight += metrics.height;
        }
    } while (textWidth > textField.width || textHeight > textField.height);

    fontSize = fontSize - 6;
    // Calculate the position to start the text to center it in the text area
    const x = textField.x;
    const startY = textField.y + (textField.height - textHeight) / 2; // Adjust Y position to center the text vertically

    // Generate SVG for each line of text and position them correctly
    let textSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${textField.width}" height="${textField.height}">`;
    // make rectangle around full textField
    // textSvg += `<rect x="0" y="0" width="${textField.width}" height="${textField.height}" fill="none" stroke="red" stroke-width="5" />`;
    console.log("TextField Width:", textField.width);
    let currentY = 0;
    for (let line of lines) {
        const lineX = (textField.width/2)
        const lineSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${textField.width}" height="${fontSize * 1.25}">
                    <text x="${lineX}" y="${fontSize}" font-size="${fontSize}" fill="${fontColor}" text-anchor="middle" font-weight="${fontWeight}" font-family="${fontFamily}" ${stroke} >${line}</text>
                 </svg>`;
    
        // Calculate the height for the inner SVG based on the font size
        const lineHeight = fontSize * 1.25; // Adjust the multiplier as needed
    
        // Wrap the line SVG in an outer SVG with the calculated height and add a rectangle box
        textSvg += `<svg xmlns="http://www.w3.org/2000/svg" width="${textField.width}" height="${lineHeight}" y="${currentY}">
                        ${lineSvg}
                    </svg>`;
    
        currentY += lineHeight; // Move to the next line
    }
    textSvg += '</svg>';
    

    return { svg: textSvg, x: x, y: startY }; // Adjust Y position to center the text vertically
}

const airstack = async (query) => {
    const { data, error } = await fetchQuery(query);

    if (error) {
        throw new Error(error.message);
    }

    return data;
};

const checkTokenBalance = async (fid) => {
    const lookupUsername = await neynar.lookupUserByFid(fid)
    console.log("Lookup Fid:", fid)
    const verifiedAddresses = lookupUsername.result.user.verifications;
    console.log("Verified Addresses:", verifiedAddresses);
    if (verifiedAddresses.length === 0) {
        return {
            "tybg": false,
            "degen": false
        };
    }
    const formattedAddresses = verifiedAddresses.map(address => `"${address}"`);
    const resultString = `[${formattedAddresses.join(',')}]`;

    const query = `
        query BalanceQuery {
            TokenBalances(
            input: {filter: {tokenAddress: {_in: ["0x0d97F261b1e88845184f678e2d1e7a98D9FD38dE", "0x4ed4E862860beD51a9570b96d89aF5E1B0Efefed"]}, owner: {_in: ${resultString}}}, blockchain: base}
            ) {
            TokenBalance {
                
                token {
                name
                }
                formattedAmount
            }
            }
        }
    `;

    const userSocials = await airstack(query);
    const tokens = userSocials.TokenBalances.TokenBalance.map(item => item.token.name);
    return {
        "tybg": tokens.includes("Base God"),
        "degen": tokens.includes("Degen")
    }
}

// Start of the frame
router.get('/', async (req, res) => {    
    res.send(starterFrame());
});

router.post('/', (req, res) => {
    res.send(starterFrame());
});

router.get('/image', async (req, res) => {
    let o = req.query?.o; // Option (id of the meme)
    const t1 = req.query?.t1?.replace(/&/g, '&amp;'); // Text to overlay with '&' replaced
    const t2 = req.query?.t2?.replace(/&/g, '&amp;'); // Text to overlay with '&' replaced
    let f = req.query?.f; // Final? True or false
    //console log full url query
    console.log(req.url);
    console.log("o:", o);
    console.log("f:", f);

    // if o is undefined, o == 8 and f == 1
    if (!o) {
        o = 8;
        f = 1;
    }

    const meme = memes[o - 1]; // Selected meme
    let imageUrl;

    // Get count of completed t1 and t2 in one line
    let completedFields = (t1 ? 1 : 0) + (t2 ? 1 : 0);
    // Get number of text fields in the meme
    let totalFields = meme.textFields.length;

    if (f=="1") {
        imageUrl = './public/frameme/images/' + `4_${o}.png`;
    } else if (completedFields === 0) {
        imageUrl = './public/frameme/images/' + `2_${o}.png`;    
    } else if (completedFields < totalFields) {
        imageUrl = './public/frameme/images/' + `2_${o}b.png`;
    } else {
        imageUrl = './public/frameme/images/' + `3_${o}.png`;
    }

    // Load the background image
    let image = sharp(imageUrl).resize(1500, 1500);

    let overlays = [];

    // Overlay text for the first text field
    if (meme && meme.textFields.length > 0 && t1) {
        const textField = meme.textFields[0]; // First text field

        // Fit text to the text area
        const { svg: textSvg, x, y } = fitTextToArea(t1, textField, meme, textToSVG);

        // Convert SVG to buffer
        const textBuffer = await sharp(Buffer.from(textSvg)).toBuffer();

        // Add overlay for the first text field
        overlays.push({ input: textBuffer, top: Math.round(y), left: Math.round(x) });
    }

    // Overlay text for the second text field
    if (meme && meme.textFields.length > 1 && t2) {
        const textField = meme.textFields[1]; // Second text field

        // Fit text to the text area
        const { svg: textSvg, x, y } = fitTextToArea(t2, textField, meme, textToSVG);

        // Convert SVG to buffer
        const textBuffer = await sharp(Buffer.from(textSvg)).toBuffer();

        // Add overlay for the second text field
        overlays.push({ input: textBuffer, top: Math.round(y), left: Math.round(x) });
    }

    // Composite both text overlays onto the background image
    if (overlays.length > 0) {
        image = image.composite(overlays);
    }

    // Send the final image
    const finalImage = await image.png().toBuffer();
    res.type('png').send(finalImage);
});


router.post('/step1', async (req, res) => {
    const buttonIndex = req.body.untrustedData?.buttonIndex;
    const fid = req.body.untrustedData?.fid;
    const o = req.query?.o;
    let imageUrl, postUrl, inputHTML, availableMemes;

    console.log("STEP 1");
    console.log("Button Index:", buttonIndex);
    console.log("fid", fid);

    availableMemes = memes;

    try {
        let user, follow, tokens;

        if(!o){

            stateStorage[fid] = {}; // recheck every time the user starts over

            try{
                tokens = await checkTokenBalance(fid);
                console.log("Tokens:", tokens);
                stateStorage[fid].tybg = tokens.tybg;
                stateStorage[fid].degen = tokens.degen;
            } catch (error) {
                console.error("Error checking token balance:", error);
            }
        }

        try{
            user = await neynar.lookupUserByFid(fid);
            follow = await neynar.fetchBulkUsers([3391, 20923], { viewerFid: fid })
            console.log("Follow:", follow.users[1].viewer_context.following);
            stateStorage[fid].activeStatus  = user.result.user.activeStatus === "active" ? true : false;
            stateStorage[fid].username = user.result.user.username;
            stateStorage[fid].following = follow.users[1].viewer_context.following;
        } catch (error) {
            console.error("Error looking up user by FID:", error);
        }

        console.log(`User ${fid} is ${stateStorage[fid].activeStatus ? "active" : "inactive"}, has username @${stateStorage[fid].username}, and is ${stateStorage[fid].following ? "following" : "not following"} @ok.`)
    } catch (error) {
        console.error("Error finding user data:", error);
        stateStorage[fid] = {}
    }

    if (!stateStorage[fid].degen) {
        // remove the 10th meme from the array
        console.log("removing 10th meme because user is not a degen")
        availableMemes = availableMemes.filter(meme => meme.id !== 10);
    }
    
    if (!stateStorage[fid].tybg) {
        // remove the 9th meme from the array
        console.log("removing 9th meme because user is not a tybg")
        availableMemes = availableMemes.filter(meme => meme.id !== 9);
    }
    // Determine which image array to use based on the active status
    if (!(stateStorage[fid].activeStatus || stateStorage[fid].following)) {
        // remove the 8th meme from the array
        console.log("removing 8th meme because user is not active or following")
        availableMemes = availableMemes.filter(meme => meme.id !== 8);
    } 

    // START OF STEP 1    
    if (!o) {
        imageUrl = base_img_url + "1_1.png";
        postUrl = base_api_url + "step1?o=1";
        inputHTML = `
                    <meta property="fc:frame:button:1" content="⫷" />
                    <meta property="fc:frame:button:2" content="⫸" />
                    <meta property="fc:frame:button:3" content="☝ Use #1" />
                    `;
    
    // USER ITERATING THROUGH MEMES
    } else if (buttonIndex == 1 || buttonIndex == 2) {
        const evalOption = buttonIndex == 1 ? -1 : 1;
        const nextOption = ((parseInt(o) + evalOption - 1 + availableMemes.length) % availableMemes.length) + 1;
        console.log("evalOption:", evalOption);
        console.log("nextOption:", nextOption);
        imageUrl = base_img_url + `1_${nextOption}.png`;
        postUrl = base_api_url + `step1?o=${nextOption}`;
        inputHTML = `
                    <meta property="fc:frame:button:1" content="⫷" />
                    <meta property="fc:frame:button:2" content="⫸" />
                    <meta property="fc:frame:button:3" content="☝ Use #${nextOption}" />
                    `;
    // USER SELECTS MEME
    } else if (buttonIndex == 3) {
        console.log(`STEP 2: USER SELECTED MEME #${o}`);
        imageUrl = base_img_url + `2_${o}.png`;
        postUrl = base_api_url + `step2?o=${o}`;
            // If meme has more than 1 text field...
        if (availableMemes[o-1].textFields.length > 1) {
            console.log("more than one field")
            inputHTML = `
                        <meta property="fc:frame:input:text" content="Write meme text..." />
                        <meta property="fc:frame:button:1" content="Next Input ⫸" />
                        <meta property="fc:frame:button:2" content="🏠 Start Over" />
                        `;
        } else {
            console.log("only one field")
            inputHTML = `
                        <meta property="fc:frame:input:text" content="Write meme text..." />
                        <meta property="fc:frame:button:1" content="🚀 Generate" />
                        <meta property="fc:frame:button:2" content="🏠 Start Over" />
                        `;
        }
    }

    res.send(frameStructure(imageUrl, postUrl, inputHTML));
});

// POST /step2 route
router.post('/step2', async (req, res) => {
    const buttonIndex = req.body.untrustedData?.buttonIndex;
    const fid = req.body.untrustedData?.fid;
    const o = req.query?.o;
    let inputText = req.body.untrustedData?.inputText;
    if (!inputText) {
        console.log("empty string submissions")
        inputText = ' ';
    }
    const encodedInputText = encodeURIComponent(inputText);
    const t1 = req.query?.t1; // Text to overlay
    const encodedT1 = encodeURIComponent(t1);

    let imageUrl, postUrl, shareUrl, inputHTML;

    console.log("STEP 2 in /step2");
    console.log("Button Index:", buttonIndex);
    console.log("Option:", o);
    console.log("Input Text:", inputText);

    if (buttonIndex == 2) {
        res.send(starterFrame());
        return;
    } else {
        if (memes[o-1].textFields.length > 1 && !t1) {
            imageUrl = base_api_url + `image?o=${o}&t1=${encodedInputText}`;
            postUrl = base_api_url + `step2?o=${o}&t1=${encodedInputText}`;
            inputHTML = `
                <meta property="fc:frame:input:text" content="Write meme text..." />
                <meta property="fc:frame:button:1" content="🚀 Generate" />
                <meta property="fc:frame:button:2" content="🏠 Start Over" />
            `;
        } else if (memes[o-1].textFields.length > 1 && t1) {
            imageUrl = base_api_url + `image?o=${o}&t1=${encodedT1}&t2=${encodedInputText}`;
            shareUrl = base_api_url + `share?o=${o}&t1=${encodedT1}&t2=${encodedInputText}`;
            console.log("Share URL:", shareUrl);

            const shortUrlId = await createShortUrl(shareUrl); // Create a short URL
            console.log("Short URL:",`${base_api_url}id/${shortUrlId}`);

            postUrl = base_api_url + `step3?o=${o}&s=${shortUrlId}&t1=${encodedT1}&t2=${encodedInputText}`;
            
            inputHTML = `
                <meta property="fc:frame:button:1" content="Share" />
                <meta property="fc:frame:button:1:action" content="link" />
                <meta property="fc:frame:button:1:target" content="https://warpcast.com/~/compose?text=Frameme by %40ok&embeds[]=${base_api_url}id/${shortUrlId}";>
                <meta property="fc:frame:button:2" content="🚀 Mint" />
                <meta property="fc:frame:button:3" content="🏠 Start Over" />
            `;
        } else if (memes[o-1].textFields.length == 1) {
            imageUrl = base_api_url + `image?o=${o}&t1=${encodedInputText}`;
            shareUrl = base_api_url + `share?o=${o}&t1=${encodedInputText}`;
            console.log("Share URL:", shareUrl);

            const shortUrlId = await createShortUrl(shareUrl); // Create a short URL
            console.log("Short URL:",`${base_api_url}id/${shortUrlId}`);

            postUrl = base_api_url + `step3?o=${o}&s=${shortUrlId}&t1=${encodedInputText}`;

            inputHTML = `
                <meta property="fc:frame:button:1" content="Share" />
                <meta property="fc:frame:button:1:action" content="link" />
                <meta property="fc:frame:button:1:target" content="https://warpcast.com/~/compose?text=Frameme by %40ok&embeds[]=${base_api_url}id/${shortUrlId}";>
                <meta property="fc:frame:button:2" content="🚀 Mint" />
                <meta property="fc:frame:button:3" content="🏠 Start Over" />
            `;
        } else {
            console.log("Error in /step2");
            res.send(errorFrame);
            return;
        }
    }

    res.send(frameStructure(imageUrl, postUrl, inputHTML));
});

router.post('/step3', async (req, res) => {

    const buttonIndex = req.body.untrustedData?.buttonIndex;
    const fid = req.body.untrustedData?.fid;
    const o = req.query?.o;
    const t1 = req.query?.t1; // Text to overlay
    const t2 = req.query?.t2; // Text to overlay
    const s = req.query?.s; // Short URL ID

    let imageUrl, postUrl, inputHTML;
    
    console.log("STEP 3");
    console.log("Button Index:", buttonIndex);
    console.log("Option:", o);
    console.log("Text 1:", t1);
    t2 ? console.log("Text 2:", t2) : null;

    // Check the number of successful entries for the fid in the database
    const client = await db.connect();
    try {
        const result = await client.query('SELECT COUNT(*) FROM minted_items WHERE fid = $1', [fid]);
        const successCount = parseInt(result.rows[0].count);

        if (successCount >= 2  && fid !== 3391) {
            // FID has 2 or more successful entries
            console.log("User has 2 or more successful mints");
            imageUrl = base_img_url + "4_max.png";
            postUrl = base_api_url;
            inputHTML =`
                <meta property="fc:frame:button:1" content="Share Frameme" />
                <meta property="fc:frame:button:1:action" content="link" />
                <meta property="fc:frame:button:1:target" content="https://warpcast.com/~/compose?text=Frameme by %40ok&embeds[]=${base_api_url}id/${s}";>
                <meta property="fc:frame:button:2" content="🏠 Start Over" />
            `
        } else {
            if (buttonIndex == 2) {
                console.log("MINTING")
        
                const follow = await neynar.fetchBulkUsers([3391, 20923], { viewerFid: fid })
                console.log("Follow:", follow.users[0].viewer_context.following);
        
                stateStorage[fid].following = follow.users[0].viewer_context.following;
        
                if (stateStorage[fid].following || fid == 3391){
                    imageUrl = base_img_url + "4.png";
                    postUrl = base_api_url + `step4?o=${o}&s=${s}`;
                    inputHTML = `
                        <meta property="fc:frame:input:text" content="ETH address or @user to mint to" />
                        <meta property="fc:frame:button:1" content="Mint to 👆" />
                        <meta property="fc:frame:button:2" content="Mint to me" />
                        <meta property="fc:frame:button:3" content="🏠 Start Over" />
                                `;
                } else {
                    imageUrl = base_img_url + "4_follow.png";
                    postUrl = base_api_url + `step3?o=${o}&s=${s}&t1=${encodeURIComponent(t1)}${t2 ? `&t2=${encodeURIComponent(t2)}` : ""}`;
                    inputHTML = `
                        <meta property="fc:frame:button:1" content="Follow @ok" />
                        <meta property="fc:frame:button:1:action" content="link" />
                        <meta property="fc:frame:button:1:target" content="https://warpcast.com/ok";>
                        <meta property="fc:frame:button:2" content="✅ Let's Mint!" />
                        <meta property="fc:frame:button:3" content="🏠 Start Over" />
                    `;
                }
            } else {        
                res.send(starterFrame());
                return;
            }        
        }
    } catch (error) {
        console.error('Error querying minted_items:', error);
        // Handle error (e.g., send an error response)
    } finally {
        client.release();
    }  
    res.send(frameStructure(imageUrl, postUrl, inputHTML));
});

router.post('/step4', async (req, res) => {
    const buttonIndex = req.body.untrustedData?.buttonIndex;
    const fid = req.body.untrustedData?.fid;
    const s = req.query?.s;
    const o = req.query?.o;
    const trustedData =  req.body.trustedData?.messageBytes;

    let imageUrl, postUrl, inputHTML;

    imageUrl = base_img_url + "6.png";
    postUrl = base_api_url + `step4?o=${o}&s=${s}`;
    
    if (buttonIndex == 1 || buttonIndex == 2) {
        console.log(`User selected button ${buttonIndex}`)
        const userAddress = (buttonIndex == 1) ? req.body.untrustedData?.inputText : "@" + stateStorage[fid].username;
        console.log("User Address:", userAddress);
        // Check if the user address is a valid Ethereum address or ENS name
        let resolvedAddress;
        try{
            resolvedAddress = await checkStringType(userAddress);
        } catch (error) {
            console.error("Error checking string type:", error);
            resolvedAddress = false;
        }

        if (!resolvedAddress) {
            console.log("Invalid address");
            imageUrl = base_img_url + "4_error.png";
            postUrl = base_api_url + `step4?o=${o}&s=${s}`;
            inputHTML = `
                <meta property="fc:frame:input:text" content="ETH address or @user to mint to" />
                <meta property="fc:frame:button:1" content="Mint to 👆" />
                <meta property="fc:frame:button:2" content="Mint to me" />
                <meta property="fc:frame:button:3" content="🏠 Start Over" />
                        `;
            res.send(frameStructure(imageUrl, postUrl, inputHTML));
            return;
        }

        // Use the resolved address in your code
        console.log("Resolved address:", resolvedAddress);

        const smartContractAddress = "0x1ebddf3b4e608252a25112aed3a0a88d1384985f"
        const functionSignature = "mint(address to, string tokenUri)"
        const username = stateStorage[fid].username
        const tokenURI = base_api_url + `metadata?username=${username}&o=${o}&s=${s}`;
        const args = {to: resolvedAddress, tokenUri: tokenURI}
        console.log("tokenURI to mint:", tokenURI);

        syndicateActionRes(trustedData, smartContractAddress, functionSignature, args).then(async (syndicateRes) => {
            console.log("Syndicate response:", syndicateRes);
            if (syndicateRes.success) {
                // Record to Heroku Postgres
                const client = await db.connect();
                try {
                    await client.query('INSERT INTO minted_items (fid, transaction_id) VALUES ($1, $2)', [fid, syndicateRes.data.transactionId]);
                } catch (error) {
                    console.error('Error inserting into minted_items:', error);
                    // Handle error (e.g., send a different response to the client)
                } finally {
                    client.release();
                }
            }
            console.log("Sending confirmation as Frame response");                  
            postUrl = base_api_url
            console.log("username", username)
            res.status(200).setHeader("Content-Type", "text/html").send(`
                <!DOCTYPE html>
                <html>
                <head>
                    <meta property="fc:frame" content="vNext" />
                    <meta property="fc:frame:image" content="${successImgUrl}" />
                    <meta property="fc:frame:image:aspect_ratio" content="1:1" />
                    <meta property="og:image"  content="${successImgUrl}" />
                    <meta property="fc:frame:button:1" content="🔗 View Frameme" />
                    <meta property="fc:frame:button:1:action" content="link">
                    <meta property="fc:frame:button:1:target" content="https://opensea.io/collection/frameme?search%5Bquery%5D=%40${username}&search%5BsortAscending%5D=false&search%5BsortBy%5D=CREATED_DATE">                        
                    <meta property="fc:frame:button:2" content="Share" />
                    <meta property="fc:frame:button:2:action" content="link" />
                    <meta property="fc:frame:button:2:target" content="https://warpcast.com/~/compose?text=I minted a frameme!&embeds[]=${base_api_url}id/${s}" />
                    <meta property="fc:frame:button:3" content="Make Another!" />
                    <meta property="fc:frame:post_url" content="${postUrl}" />
                </head>
                <body>
                </body>
                </html>
            `);
            return;
        }).catch((error) => {
            console.log("Error:", error);
            postUrl = base_api_url + `step4?s=${s}`;
            res.send(`
                <!DOCTYPE html>
                <html>
                <head>
                    <meta property="fc:frame" content="vNext" />
                    <meta property="fc:frame:image" content="${failImgUrl}" />
                    <meta property="fc:frame:image:aspect_ratio" content="1:1" />
                    <meta property="og:image"  content="${failImgUrl}" />
                    <meta property="fc:frame:input:text" content="ETH address or @user to mint to" />
                    <meta property="fc:frame:button:1" content="Mint to 👆" />
                    <meta property="fc:frame:button:2" content="Mint to me" />
                    <meta property="fc:frame:button:3" content="🏠 Start Over" />
                    <meta property="fc:frame:post_url" content="${postUrl}" />
                </head>
                <body>
                </body>
                </html>
            `);
            return;
        });
    } else {
        res.send(frameStructure(imageUrl, postUrl, inputHTML));
        return;
    }
});

// // A post api that returns a 302 redirect to the "www.cnn.com" website
// router.post('/redirect', (req, res) => {
//     const url = "https://warpcast.com/~/compose?text=Post your frameme!&embeds[]=https://frameme.xyz";
//     res.redirect(302, url);
// }) //

router.get('/share', (req, res) => {
    const o = req.query?.o;
    const t1 = req.query?.t1; // Text to overlay
    const t2 = req.query?.t2; // Text to overlay
    const imageObj = {
        o, t1, t2
    }

    res.send(starterFrame(imageObj));
});

export default router;