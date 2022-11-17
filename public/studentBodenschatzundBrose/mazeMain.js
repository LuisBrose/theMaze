window.onload=async()=>{
    let personData = await(await fetch("/api/person")).json();
    document.getElementById("menu").innerHTML = 'User: '+personData.name;
    await displayInventory(personData.things);

    document.getElementById("ndoor").onclick=()=>goToNextRoom('n');
    document.getElementById("wdoor").onclick=()=>goToNextRoom('w');
    document.getElementById("edoor").onclick=()=>goToNextRoom('e');
    document.getElementById("sdoor").onclick=()=>goToNextRoom('s');

    updateRoom();
}
//http://localhost:3000/studentBodenschatzundBrose/theMaze.html

async function updateRoom(){
    let roomInfo = await getRoomInfo();

    document.getElementById("room").style.background = roomInfo.color;

    displayAllDoors(false);
    for (const door in roomInfo.directions) {
        displayDoor(true,roomInfo.directions[door]+"door");
    }

    setTimeout(updateRoom,1000);
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

async function displayInventory(items){
    const inventory = await document.getElementById("inv");
    for (const itemsKey in items) {
        let child = document.createElement("img");
        child.classList.add(itemsKey.toString());
        inventory.appendChild(child);
    }
}

async function getDoor(direction){
    const response = await fetch("/api/door/"+direction)
    let result = await response.json();
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
    window.alert(result.description);
}

async function goToNextRoom(direction){
    const response = await fetch('/api/person?'+new URLSearchParams({go:direction}), {
        method: 'PATCH',
        headers: {
            'Content-type': 'application/json; charset=UTF-8',
        },
    });
    let result = await response.json();
    window.alert(result.error.toString());
}

async function getRoomInfo(){
    const response = await fetch('/api/position');
    let result = await response.json();
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
}