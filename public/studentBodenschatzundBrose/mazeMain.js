"use strict";

window.onload=async()=>{
    let x=30,y=30;

    initMap();
    let personData = await(await fetch("/api/person")).json();

    document.getElementById("menu").innerHTML = (
        'Welcome '+personData.name+"<br><br>"+"How to Play?<br>"+
            "door: enter the next room<br>"+
            "lock: unlock door (find a key first)<br>"+
            "Find the Treasure to win<br><br>Good Luck Adventurer"
    );

    await displayInventory(personData.things);

    document.getElementById("ndoor").onclick=async ()=>{
        if(await goToNextRoom('n')){
            setMapPart(x,y,false);
            x--;
            setMapPart(x,y,true);
        }
    }
    document.getElementById("wdoor").onclick=async ()=>{
        if(await goToNextRoom('w')){
            setMapPart(x,y,false);
            y--;
            setMapPart(x,y,true);
        }
    }
    document.getElementById("edoor").onclick=async ()=>{
        if(await goToNextRoom('e')){
            setMapPart(x,y,false);
            y++;
            setMapPart(x,y,true);
        }
    }
    document.getElementById("sdoor").onclick=async ()=>{
        if(await goToNextRoom('s')){
            setMapPart(x,y,false);
            x++;
            setMapPart(x,y,true);
        }
    }

    await updateRoom();
}
//http://localhost:3000/studentBodenschatzundBrose/theMaze.html

async function updateRoom(){
    let roomInfo = await getRoomInfo();

    document.getElementById("room").style.background = roomInfo.color;

    displayAllDoors(false);
    for (const door in roomInfo.directions) {
        displayDoor(true,roomInfo.directions[door]+"door");
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

    for (const door in allDoors) {
        let elem = document.getElementById(allDoors[door]);
        if (show) elem.hidden = false;
        else elem.hidden = true;
    }
}

function displayDoor(show,id){
    let elem = document.getElementById(id);
    if (show) elem.hidden = false;
    else elem.hidden = true;
}

function getRandomValue(min,max){
    let random=min+Math.floor(Math.random()*(max-min));
    return random;
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
    const response = await fetch("/api/door/"+direction)
    let result = await response.json();
    if(!response.ok)displayInConsole(result.error);
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
    con.innerText = ':: '+message + '\n' + con.innerText;

    let lines = con.innerText.split("\n");

    if(lines.length==15){
        let cut = lines[13].length+1;
        console.log(cut);
        con.innerText = con.innerText.substring(0,con.innerText.length-cut);
    }
}

function initMap(){
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

    setMapPart(30,30,true);
}

function setMapPart(x,y,current){
    let mapPart = document.getElementById("mp"+x+y);
    if(current)mapPart.src = "/studentBodenschatzundBrose/icons/minimap/current.png";
    else mapPart.src = "/studentBodenschatzundBrose/icons/minimap/test.png";
}