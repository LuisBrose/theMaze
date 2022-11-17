window.onload=async ()=>{
}
//http://localhost:3000/studentBodenschatzundBrose/theMaze.html
class personfull{name;things}
class person{name}
class thing{name}
class position{name;color;description;directions;persons;things}
class door{closable;open;locked}
class doorAction{action;key}
class error{error}
class errorWithPosition{error;position}

function update(){

}

async function changeDoorState(direction,action,key){
    let response = await fetch('/api/door/'+direction, {
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
}

async function goToNextRoom(direction){
    let response = await fetch('/api/person?'+new URLSearchParams({go:direction}), {
        method: 'PATCH',
        headers: {
            'Content-type': 'application/json; charset=UTF-8',
        },
    });
    let result = await response.json();
    window.alert(result.error.toString());
}