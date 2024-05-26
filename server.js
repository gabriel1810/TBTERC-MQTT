const dotenv = require('dotenv');
dotenv.config();
const express = require('express')
const mqtt = require("mqtt");
const bodyParser = require('body-parser');
const path = require('path');
const http = require('http');
const WebSocket = require('ws');
const app = express()
const NodePort = 3000;
const db = require('./database.js');



app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json());

app.get('/', (req, res) => {
    res.redirect('/sala/1');
  });

app.get('/sala/*',async(req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'sala/index.html'));
});


app.get('/getAlertas',async(req, res) => {
    let sensor = req.query.sensor;
    let limite = req.query.limite;
    let idTipoAlerta = req.query.idTipoAlerta;
    let listaDeidTipoAlerta = idTipoAlerta.split(',')
    
    let alertas = await db.obterAlertas(sensor,limite,listaDeidTipoAlerta)
    res.send(alertas);
});

app.get('/getUltimoAlerta',async(req, res) => {
    let sensor = req.query.sensor;
    let alerta = await db.obterUltimoAlerta(sensor)
    res.send(alerta);
});


app.put('/setarNovosParametros', async (req, res) => {
    let dispositivo = req.body.dispositivo;
    let vlBaseDist = req.body.vlBaseDist;
    let vlBaseLum = req.body.vlBaseLum;
    let topico = "";

    switch(dispositivo){
        case "D1MINI_PRO":
            topico = "sensor1/config"
            break;
        case "NODEMCU":
            topico = "sensor2/config"
            break;  
        case "D1_MINI":
            topico = "sensor3/config"
            break;  
    }
    let msg = "{"
    if(vlBaseLum && vlBaseDist){
        msg += `\"baseLightValueTurnedOn\":${vlBaseLum},\"baseDistance\":${vlBaseDist}`
    }
    else if(vlBaseLum && !vlBaseDist){
        msg += `\"baseLightValueTurnedOn\":${vlBaseLum}`
    }
    else if(!vlBaseLum && vlBaseDist){
        msg += `\"baseDistance\":${vlBaseDist}`
    }

    msg += "}"
    publishMessage(topico,msg);
    res.sendStatus(200);  
});


const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

wss.on('connection', ws => {
    console.log('Client connected');
    ws.on('close', () => {
        console.log('Client disconnected');
    });
});


server.listen(NodePort, () => {
    console.log(`Server is running on port ${NodePort}`);
});


// MQTT
var mqttClient;
const mqttHost = process.env.MQTT_HOST
const protocol = "mqtt"
const port = "1883"
const TOPIC = process.env.MQTT_TOPIC
const username = process.env.MQTT_USERNAME
const password = process.env.MQTT_PASSWORD

function connectToBroker(){
    const clientId = "servidor";
    const hostURL = `${protocol}://${mqttHost}:${port}`;

    const options = {
        keepalive: 60,
        clientId: clientId,
        protocolId: "MQTT",
        protocolVersion: 4,
        clean: true,
        reconnectPeriod:1000,
        connectTimeout: 30*1000,
        username: username,
        password: password
    }

    mqttClient = mqtt.connect(hostURL,options);
    mqttClient.on("error", (err) => {
        console.log("Error: ", err);
        mqttClient.end();
    });

    mqttClient.on("reconnect", () =>{
        console.log("Reconnecting...");
    });

    mqttClient.on("message", async (topic,message,packet) => {
        try{
            //console.log(message.toString())
            let messageJSON = JSON.parse(message.toString());
            let status = messageJSON.status;
            let sensor = messageJSON.sensorId;
            let distValue = messageJSON.distanceValue;
            let luzValue = messageJSON.lightValue;
           
            // Verificacao de Disponibilidade
            if(status){
                await db.salvarAlerta(sensor,0,distValue,luzValue);
            }

            // Alerta detectado
            else{
                let movimentoDetectado = messageJSON.movementDetected;
                let luzDetectada = messageJSON.lightDetected;
                let idTipoAlerta;
                if(movimentoDetectado && luzDetectada){
                    idTipoAlerta = 3;
                }
                else if(movimentoDetectado && !luzDetectada){
                    idTipoAlerta = 2;
                }
                else if(!movimentoDetectado && luzDetectada){
                    idTipoAlerta = 1;
                }

                // arrumar bug
                if(distValue < 1000){
                    await db.salvarAlerta(sensor,idTipoAlerta,distValue,luzValue)
                    broadcast(JSON.stringify({ type: 'alerta', sensor, distValue, movimentoDetectado, luzValue, luzDetectada }));
                }


            }
        }
        catch(err){
            console.log(err)
        }
    });
}

function publishMessage(topic,message){
    //console.log(`Sending Topic: ${topic}, Message: ${message}`);
    mqttClient.publish(topic,message,{
        qos: 0,
        retain:false
    })
}

function subscribeToTopic(topic){
    //console.log(`Subscribing to topic: ${topic}`);
    mqttClient.subscribe(topic,{qos:0});
}

function broadcast(data) {
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(data);
        }
    });
}



connectToBroker();
subscribeToTopic(TOPIC);

