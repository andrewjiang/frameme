// Import necessary modules
import express from 'express';
import TextToSVG from 'text-to-svg';
import framemeRouter from './frames/frameme/frameme.mjs';
import valentinesRouter from './frames/valentines/valentinesRoutes.mjs';


const textToSVG = TextToSVG.loadSync('./Avantt-SemiBold.ttf');
const textToSVG2 = TextToSVG.loadSync('./Avantt-Regular.ttf');

// Initialize Express
const app = express();
const port = process.env.PORT || 3001;

app.use(express.json()); // for parsing application/json

app.use('/frameme', framemeRouter);
app.use('/valentines', valentinesRouter);
app.use('/static', express.static('public'));

// Redirect root route to frameme route
app.get('/', (req, res) => {
    res.redirect('/frameme');
});

app.listen(port, () => {
  console.log(`Farcaster frame server listening at http://localhost:${port}`);
});
