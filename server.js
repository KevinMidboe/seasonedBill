var express = require('express')
var bodyParser = require('body-parser')
const axios = require('axios')

var PORT = process.env.PORT || 3000;
var BOT_TOKEN = process.env.SLACK_BOT_TOKEN || undefined;
if (!BOT_TOKEN) {
  throw new Error("please set the SLACK_BOT_TOKEN environmental variable");
}

var router = express.Router()

router.use(function timeLog(req, res, next) {
  console.log('Time: ', Date.now())
  console.log('payload type', req.body.type)
  next()
})

router.use((req, res, next) => {
  res.setHeader('Content-Type', 'application/json');
  next()
})


function postMessage(msg, channel) {
  const data = {
    "text": msg,
    "channel": channel 
  }
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${BOT_TOKEN}` 
  }

  axios.post('https://slack.com/api/chat.postMessage', data, {headers: headers})
  .then((resp) => console.log(resp.data))
  .catch((error) => console.error(error.data))
}

router.post('/slack/list', (req, res, next) => {
  axios.get('https://api.kevinmidboe.com/api/v1/seasoned/all')
  .then((resp) => {
    const shortlist = resp.data.slice(-3)
    console.log('shortList', shortlist)

    res.json(shortlist);
  })
})


router.post('/slack/event', (req, res, next) => {
  const payload = req.body;
  const type = payload.type;

  if (type === 'url_verification') {
    res.json({ challenge: payload.challenge })
  }

  else if (payload.event.type === 'app_mention') {
    if (payload.event.text.includes("joke")) {
      console.log('someone is hungry for a joke');

      axios.get('http://api.icndb.com/jokes/random')
      .then((resp) => {
	const msg = `Hello <@${payload.event.user}>! ${resp.data.value.joke}`
	postMessage(msg, payload.event.channel) 
      })
    }
  }

  res.json({ challenge: payload.challenge })
})

var app = express()

app.use(bodyParser.json())
app.use(router)

app.listen(PORT, () => {
  console.log('Listening on port:', PORT);
})

