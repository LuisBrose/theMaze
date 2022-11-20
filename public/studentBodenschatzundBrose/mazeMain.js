"use strict";

let xy = [30,30];

window.onload=async()=>{
    document.getElementById('message').hidden = true;

    await initMap();
    let personData = await(await fetch("/api/person")).json();
    displayAllDoors(false);

    document.getElementById("menu").innerHTML = (
        'Welcome '+personData.name+"<br><br>"+"How to Play?<br>"+
            "door: enter the next room<br>"+
            "lock: unlock door (find a key first)<br>"+
            "Find the Treasure to win<br><br>Good Luck Adventurer"
    );

    await displayInventory(personData.things);

    const directions = ['n','w','e','s'];

    for (const direction in directions) {
        let dir = directions[direction]
        document.getElementById(dir+"door").onclick=()=>doorOnClick(dir);
    }

    let roomInfo = await getRoomInfo();
    displayMessage(roomInfo.description);

    await updateRoom();
}
//http://localhost:3000/studentBodenschatzundBrose/theMaze.html

async function doorOnClick(direction){
    let x = xy[0];
    let y = xy[1];

    if(await goToNextRoom(direction)){
        setMapPart(x,y,false);
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
        setMapPart(x,y,true);
    }

    xy = [x,y];
}

async function updateRoom(){
    let roomInfo = await getRoomInfo();

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

    setTimeout(await updateRoom,100);
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

    if (show) {
        elem.hidden = false;
    }
    else {
        elem.hidden = true;
    }
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
    switch (name){
        case "Ring":
            return "/studentBodenschatzundBrose/icons/ring_gold-rot.png";
        case "Schlüssel":
            let random = getRandomValue(1,5);
            return "/studentBodenschatzundBrose/icons/schlüssel"+random+".png";
        case "Krone":
            return "/studentBodenschatzundBrose/icons/krone_gold.png";
        case "Blume":
            return "/studentBodenschatzundBrose/icons/blume_lila.png";
        default:
            return "/studentBodenschatzundBrose/icons/kiste_v1.png";
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
                x.src = "/studentBodenschatzundBrose/icons/x.png";
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
    try{
    const response = await fetch("/api/door/"+direction);
    let result = await response.json();
    return result;
    }
    catch (error){
    displayInConsole(result.error);
    return null;
    }
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

function displayInConsole(message){
    let con = document.getElementById('console');
    con.innerText = '⬩ '+message + '\n' + con.innerText;

    let lines = con.innerText.split("\n");

    if(lines.length===12){
        let cut = lines[9].length+1;
        con.innerText = con.innerText.substring(0,con.innerText.length-cut);
    }
}

function displayMessage(message){
    let div = document.getElementById('message');
    div.innerText = message;
    div.hidden = false;
    //setTimeout(function (){div.hidden=true},5000);
}

async function initMap(){
    const map = document.getElementById("map");

    for (let i = 0; i < 61; i++) {
        for (let j = 0; j < 61; j++) {
            let mapPart = document.createElement("img");
            mapPart.src = "/studentBodenschatzundBrose/icons/minimap/blank.png";
            mapPart.id = "mp"+i+j;
            mapPart.classList.add("mapPart");
            map.appendChild(mapPart);
        }
    }

    await setMapPart(30,30,true);
}

async function setMapPart(x,y,current) {
    let mapPart = document.getElementById("mp" + x + y);
    let positionInfo = await getRoomInfo();

    let dirString = "";
    const allDirections = ['n', 'e', 's', 'w'];
    for (const dir in allDirections) {
        if (positionInfo.directions.includes(allDirections[dir])) dirString += allDirections[dir];
    }

    if (current) {
        mapPart.src = "/studentBodenschatzundBrose/icons/minimap/" + dirString + ".png";
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
        icon.src = "/studentBodenschatzundBrose/icons/opendoor_closed.png";
    }
    else {
        icon.onclick=()=>changeDoorState(direction,"close","");
        icon.src = "/studentBodenschatzundBrose/icons/opendoor_open.png";
    }

    if (!data.locked) {
        lock.onclick=()=>changeDoorState(direction,"lock","Schlüssel");
        lock.src = "/studentBodenschatzundBrose/icons/lock_open.png"
    }
    else {
        lock.onclick=()=>changeDoorState(direction,"unlock","Schlüssel");
        lock.src = "/studentBodenschatzundBrose/icons/lock_closed.png"
    }
}