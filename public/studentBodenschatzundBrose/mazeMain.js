"use strict";

let xy = [30,30];
let oldRoomInfo = [];
let character = 2;
let playername = "";
let keychain = "Schlüssel";

window.onload=async()=>{
    document.getElementById("button").onclick =()=>{
        document.getElementById("overlay").style.display = "none";
        document.documentElement.requestFullscreen();
    }

    document.getElementById('message').hidden = true;
    document.getElementById("map").onclick =()=> showMap(true);

    if(sessionStorage.length === 0) {
        await initMap();
    }
    else await restoreMap();

    let personData = await getPersonData();
    playername = personData.name;

    displayAllDoors(false);

    document.getElementById("menu").innerHTML = (
        'Willkommen '+personData.name+"<br>"+
            "<br>Wähle einen Charakter:"+
            "<img src='icons/characters/charakter2.png' class=\"playericon\" id=\"pi1\" alt=\"Link\">"+
            "<img src='icons/characters/charakter3.png' class=\"playericon\" id=\"pi2\" alt=\"Rex\">"+
            "<img src='icons/characters/charakter4.png' class=\"playericon\" id=\"pi3\" alt=\"Santa\">"+
            "<br><br> Schlüsselbund: <br> <input type='text' id='keychain'>"
    );

    await displayInventory(personData.things);

    const directions = ['n','w','e','s'];

    for (const direction in directions) {
        let dir = directions[direction]
        document.getElementById(dir+"door").onclick=()=>doorOnClick(dir);
    }

    let roomInfo = await getRoomInfo();
    displayMessage(roomInfo.description);

    setCharactermodel(1);
    for (let i = 1; i < 4; i++) {
        document.getElementById("pi"+i).onclick =()=> setCharactermodel(i);
    }

    await updateRoom();
}
//http://localhost:3000/studentBodenschatzundBrose/theMaze.html

function blockButtons(timeout){
    const allDir = ["n","w","s","e"];

    allDir.forEach(function(dir){document.getElementById(dir+"door").onclick = null;})

    setTimeout(function (){
        allDir.forEach(function(dir){
            document.getElementById(dir+"door").onclick =()=> doorOnClick(dir);
        })
    },timeout);
}

async function doorOnClick(direction){
    blockButtons(500);

    let x = xy[0];
    let y = xy[1];

    if(await goToNextRoom(direction)){
        await setMapPart(x, y, false);
        switch (direction){
            case 'n': x--;
                break;
            case 'w': y--;
                break;
            case 'e': y++;
                break;
            case 's': x++;
                break;
        }
        await setMapPart(x, y, true);
    }
    xy = [x,y];
    saveMap();
}

async function updateRoom(){
    let roomInfo = await getRoomInfo();

    keychain = document.getElementById('keychain').value;
    document.getElementById("room").style.background = roomInfo.color;

    for (const door in roomInfo.directions) {
        displayDoor(true,roomInfo.directions[door]);
        await setIconState(roomInfo.directions[door]);
    }

    const list = document.getElementById("itemList").childNodes;

    let itemList = document.getElementById("itemList");

    if(roomInfo.things.toString() === ""){
       itemList.innerText = "";
    }

    for (let i = 0; i < list.length; i++) {
        let item = list.item(i).textContent
        let contains;

        for (const thing in roomInfo.things) {
            if(contains)break;
            contains = (item === roomInfo.things[thing].name);
        }

        if(!contains)list.item(i).remove();
    }

    for (const thing in roomInfo.things) {
        displayItem(roomInfo.things[thing]);
    }

    updatePlayers(roomInfo, false);

    setTimeout(await updateRoom,200);
}

function displayAllDoors(show){
    const allDoors = ["ndoor","sdoor","wdoor","edoor"];
    const allMenus = ["nmenu","smenu","wmenu","emenu"];

    for (const door in allDoors) {
        let elem = document.getElementById(allDoors[door]);
        elem.hidden = !show;
    }

    for (const menu in allMenus) {
        let m = document.getElementById(allMenus[menu]);
        m.hidden = !show;
    }
}

function displayDoor(show,id){
    let elem = document.getElementById(id+"door");

    elem.hidden = !show;
}

function getRandomValue(min,max){
    return min + Math.floor(Math.random() * (max - min));
}

function displayItem(item){
    if (document.getElementById(item.name.toString()))return;
    let element = document.createElement("img");

    element.id=item.name.toString();
    element.classList.add("item");
    element.innerHTML = item.name.toString();
    element.style.left = getRandomValue(5,85)+'%';
    element.style.top = getRandomValue(5,80)+'%';

    element.src = getIconByName(item.name);

    element.onclick =async()=> {
        await changeItemState(true,item.name);
        let personData = await(await fetch("/api/person")).json();
        await displayInventory(personData.things);
    };

    document.getElementById("itemList").appendChild(element);
}

function getIconByName(name){
    if(name.includes("Schlüssel"))name = "Schlüssel";
    switch (name){
        case "Ring":
            return "icons/ring_gold-rot.png";
        case "Schlüssel":
            return "icons/schlüssel2.png";
        case "Krone":
            return "icons/krone_gold.png";
        case "Blume":
            return "icons/blume_lila.png";
        default:
            return "icons/kiste_v1.png";
    }
}

async function displayInventory(items){
    for (let i = 0; i < 5; i++)document.getElementById("i"+i).innerText = '';

    for (const item in items) {
        for (let i = 0; i < 5; i++) {
            let itemField = document.getElementById("i"+i);

            if(itemField.innerText===items[item].name)break;
            if (itemField.innerText === ''){
                itemField.innerText = items[item].name;
                itemField.style.lineHeight = '80px';

                let elem = document.createElement("img");
                elem.src = getIconByName(items[item].name);
                elem.classList.add("item");

                let x = document.createElement("img");
                x.src = "icons/x.png";
                x.classList.add("x");
                x.onclick =async()=>{
                    await changeItemState(false,items[item].name);
                    itemField.innerText = '';
                }

                itemField.appendChild(elem);
                itemField.appendChild(x);
                break;
            }
        }
    }
}

async function getDoor(direction){
    const response = await fetch("/api/door/"+direction);
    const result = await response.json();

    if(!response.ok){
        console.log(result.error);
        //displayInConsole(result.error);
        displayAllDoors(false);
    }
    return result;
}

async function changeDoorState(direction,action,key){
    const response = await fetch('/api/door/'+direction, {
        method: 'PATCH',
        body: JSON.stringify({
            action: action,
            key: key
        }),
        headers: {
            'Content-type': 'application/json; charset=UTF-8',
        },
    });
    let result = await response.json();
    if(!response.ok)displayInConsole(result.error);
    return response;
}

async function goToNextRoom(direction){
    const response = await fetch('/api/person?'+new URLSearchParams({go:direction}), {
        method: 'PATCH',
        headers: {
            'Content-type': 'application/json; charset=UTF-8',
        },
    });
    let result = await response.json();
    if(!response.ok)displayInConsole(result.error);
    else {
        displayMessage(result.description);
        displayAllDoors(false);
    }
    return response.ok;
}

async function getRoomInfo(){
    const response = await fetch('/api/position');
    let result = await response.json();
    if(!response.ok)displayInConsole(result.error);
    return result;
}

async function changeItemState(take,name){ //take -> true=take false=drop
    let url;

    if (take)url = "/api/person/thing";
    else url = "/api/position/thing";

    const response = await fetch(url,{
            method: 'POST',
            body: JSON.stringify({
                name:name
            }),
            headers: {
                'Content-type': 'application/json; charset=UTF-8',
            },
        });

    let result = await response.json();
    if(!response.ok)displayInConsole(result.error);
}

async function getPersonData(){
    let response = await fetch("/api/person");
    if(!response.ok)displayInConsole((await (response).json()).error);
    else{
        return await response.json();
    }
    return null;
}

function displayInConsole(message){
    let con = document.getElementById('console');
    con.innerText = '⬩ '+message + '\n' + con.innerText;

    let lines = con.innerText.split("\n");

    if(lines.length>=13){
        let cutVersion="";
        for (let i = 0; i < 11; i++) {
            cutVersion = cutVersion+lines[i]+'\n';
        }
        con.innerText = cutVersion;
    }
}

function displayMessage(message){
    let div = document.getElementById('message');
    div.innerText = message;
    //div.hidden = false;
    //setTimeout(function (){div.hidden=true},5000);
}

async function initMap(){
    const map = document.getElementById("map");

    for (let i = 0; i < 61; i++) {
        for (let j = 0; j < 61; j++) {
            let mapPart = document.createElement("img");
            mapPart.src = "icons/minimap/blank.png";

            if(i<10) i = '0'+i;
            if(j<10) j = '0'+j;

            mapPart.id = "mp"+i+j;
            mapPart.classList.add("mapPart");
            map.appendChild(mapPart);
        }
    }

    await setMapPart(30,30,true);
}

async function setMapPart(x,y,current) {
    if(x<10) x='0'+x;
    if(y<10) y='0'+y;

    let mapPart = document.getElementById("mp" + x + y);
    let positionInfo = await getRoomInfo();

    let dirString = "";
    const allDirections = ['n', 'e', 's', 'w'];
    for (const dir in allDirections) {
        if (positionInfo.directions.includes(allDirections[dir])) dirString += allDirections[dir];
    }

    if (current) {
        mapPart.src = "icons/minimap/" + dirString + ".png";
        mapPart.style.filter = 'brightness(150%)';
    }
    else mapPart.style.filter = 'brightness(100%)';
}

async function setIconState(direction){
    let menu = document.getElementById(direction+"menu");
    let lock = document.getElementById(direction+"lock");
    let icon = document.getElementById(direction+"dooricon");

    let data = await getDoor(direction);
    if(data === null)return;

    menu.hidden = !data.closable;

    if (!data.open) {
        icon.onclick=()=>changeDoorState(direction,"open","");
        icon.src = "icons/door_braun.png";
    }
    else {
        icon.onclick=()=>changeDoorState(direction,"close","");
        icon.src = "icons/opendoor_open.png";
    }

    if (!data.locked) {
        lock.onclick=()=>changeDoorState(direction,"lock",keychain);
        lock.src = "icons/lock_open.png"
    }
    else {
        lock.onclick=()=>changeDoorState(direction,"unlock",keychain);
        lock.src = "icons/lock_closed.png"
    }
}

function showMap(show){
    let map = document.getElementById("map");

    if(show){
        map.onclick =()=> showMap(false);
        map.style.transform = 'scale(200%) translate(-86%,-27%)';
    }
    else{
        map.onclick =()=> showMap(true);
        map.style.transform = 'scale(100%) translate(0%,0%)';
    }
}

function updatePlayers(roomInfo, skinChange){
    if(JSON.stringify(roomInfo.persons) !== JSON.stringify(oldRoomInfo.persons) || skinChange){
        oldRoomInfo = roomInfo;
        document.getElementById("players").innerText = "";
        for (const person in roomInfo.persons){
            displayCharacters(roomInfo.persons[person].name)
        }
        if(!document.getElementById(playername))displayCharacters(playername);
    }
}

function displayCharacters(name){
    let div = document.createElement("div");
    div.id = name;
    div.style.top = getRandomValue(0,85)+"%";
    div.style.left = getRandomValue(0,85)+"%";
    div.classList.add("player");
    div.innerText = name;

    let char = document.createElement("img");
    if(name === playername){
        char.src = "icons/characters/charakter"+character+"_kopf.png";
    }
    else char.src = "icons/characters/charakter"+hashName(name)+"_kopf.png";
    char.classList.add("character");

    document.getElementById("players").appendChild(div);
    div.appendChild(char);
}

function saveMap() {
    const element = document.getElementById("map");
    const elementHtml = element.innerHTML;
    sessionStorage.setItem("map", elementHtml);
    sessionStorage.setItem("x", xy[0])
    sessionStorage.setItem("y", xy[1])
}

async function restoreMap() {
    const element = document.getElementById("map");
    element.innerHTML = sessionStorage.getItem("map");

    xy[0] = sessionStorage.getItem("x");
    xy[1] = sessionStorage.getItem("y");

    await setMapPart(xy[0],xy[1],true);
}

function setCharactermodel(modelnumber){
    for (let i = 1; i < 4; i++) {
        let obj = document.getElementById("pi"+i);
        obj.style.filter = "brightness(50%)";

    }
    character = modelnumber+1;
    let obj = document.getElementById("pi"+modelnumber);
    obj.style.filter = "brightness(100%)";
    updatePlayers(oldRoomInfo, true);
}

function hashName(name){
    name = name.toLowerCase();

    let value = name.charCodeAt(0)-96;

    if(value <= 9) return 2;
    if(value <= 18) return 3;
    return 4;
}