import fetch from 'node-fetch';

async function testSend() {
    const res = await fetch('http://127.0.0.1:3000/messages/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            sessionId: 'channel_1',
            to: '157032778887422@lid',
            text: 'Halo Hanz! Ini adalah tes balasan langsung dari AI via Baileys.'
        })
    });
    const data = await res.json();
    console.log('Send response:', data);
}

testSend().catch(console.error);
