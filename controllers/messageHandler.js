const Groq = require('groq-sdk');
const twilio = require('twilio');
require('dotenv').config();

const openai = new Groq({ apiKey: process.env.GROQ_API_KEY });
const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

// Sample orders database (we'll replace with MongoDB later)
const sampleOrders = {
  'ORD001': { product: 'Rudraksha Mala', status: 'Out for Delivery', delivery: 'Today by 7 PM' },
  'ORD002': { product: 'Brass Diya Set', status: 'Shipped', delivery: 'Tomorrow by 2 PM' },
  'ORD003': { product: 'Ganesh Idol', status: 'Processing', delivery: 'In 2-3 days' },
};

// Sample products
const sampleProducts = {
  'rudraksha': { name: 'Rudraksha Mala', price: '₹599', available: true },
  'diya': { name: 'Brass Diya Set', price: '₹299', available: true },
  'ganesh': { name: 'Ganesh Idol', price: '₹999', available: false },
};

async function classifyIntent(message) {
  const response = await openai.chat.completions.create({
    model: 'llama-3.1-8b-instant',
    messages: [
      {
        role: 'system',
        content: `You are an intent classifier for a Hindu D2C brand's WhatsApp support.
Classify the user message into ONE of these intents:
- order_status (asking about their order)
- product_query (asking about a product)
- return_request (wants to return or exchange)
- greeting (just saying hi or hello)
- other (anything else)

Also extract:
- order_id if mentioned (like ORD001)
- product_keyword if mentioned (like rudraksha, diya, ganesh)

Respond ONLY in JSON like this:
{ "intent": "order_status", "order_id": "ORD001", "product_keyword": null }`
      },
      { role: 'user', content: message }
    ],
  });

  try {
    return JSON.parse(response.choices[0].message.content);
  } catch {
    return { intent: 'other', order_id: null, product_keyword: null };
  }
}

async function generateReply(intent, data, customerMessage) {
  let contextInfo = '';

  if (intent === 'order_status' && data) {
    contextInfo = `Order found: Product - ${data.product}, Status - ${data.status}, Expected Delivery - ${data.delivery}`;
  } else if (intent === 'product_query' && data) {
    contextInfo = `Product found: ${data.name}, Price - ${data.price}, Available - ${data.available ? 'Yes' : 'No, currently out of stock'}`;
  } else if (intent === 'return_request') {
    contextInfo = `Return Policy: Returns accepted within 7 days of delivery. Customer should WhatsApp us photos of the product.`;
  } else if (intent === 'greeting') {
    contextInfo = `Customer just said hello.`;
  } else {
    contextInfo = `Could not find specific info. Politely ask them to contact support or provide more details.`;
  }

  const response = await openai.chat.completions.create({
    model: 'llama-3.1-8b-instant'
,
    messages: [
      {
        role: 'system',
        content: `You are a friendly WhatsApp support bot for Divine Hindu, a spiritual D2C brand that sells puja items, malas, idols and more.
Always reply in a warm, respectful, helpful tone. Use 🙏 emoji where appropriate.
Keep replies short and clear (max 3-4 lines).
If the customer wrote in Hindi, reply in Hindi. Otherwise reply in English.`
      },
      {
        role: 'user',
        content: `Customer message: "${customerMessage}"
Context: ${contextInfo}
Write a helpful WhatsApp reply.`
      }
    ],
  });

  return response.choices[0].message.content;
}

async function handleMessage(req, res) {
  try {
    const incomingMsg = req.body.Body;
    const from = req.body.From;

    console.log(`📩 Message from ${from}: ${incomingMsg}`);

    // Step 1: Classify intent
    const { intent, order_id, product_keyword } = await classifyIntent(incomingMsg);
    console.log(`🧠 Intent: ${intent}, Order ID: ${order_id}, Product: ${product_keyword}`);

    // Step 2: Fetch relevant data
    let data = null;
    if (intent === 'order_status' && order_id) {
      data = sampleOrders[order_id] || null;
    } else if (intent === 'product_query' && product_keyword) {
      data = sampleProducts[product_keyword.toLowerCase()] || null;
    }

    // Step 3: Generate AI reply
    const reply = await generateReply(intent, data, incomingMsg);
    console.log(`💬 Reply: ${reply}`);

    // Step 4: Send reply via Twilio WhatsApp
    await twilioClient.messages.create({
      from: process.env.TWILIO_WHATSAPP_NUMBER,
      to: from,
      body: reply,
    });

    res.status(200).send('OK');

  } catch (error) {
    console.error('❌ Error:', error.message);
    res.status(500).send('Error');
  }
}

module.exports = { handleMessage };