window.onload = function() {

    authHandler();

}

const authHandler = function signUpAndSessionHandler() {

    var user_name = "";

    document.cookie.split('; ').forEach(
        function (c) {
            var cookie = c.split('=');
            if (cookie[0] === 'user_name')
                user_name = cookie[1];
        }
    )

    if (user_name.length) {
        var welcomeMessage = document.createElement('p');
        welcomeMessage.setAttribute('class', 'lead');
        welcomeMessage.innerHTML = 'Hi <span class="text-primary">' + user_name + '</span> :^)';
        var sessionInfodiv = document.getElementById("sessionInfo");
        sessionInfodiv.innerHTML = '';
        sessionInfodiv.appendChild(welcomeMessage);
        
        document.getElementById('createGame').style.display = 'block';
        reqGames();
        
    }

}

const signUp = function signUp() {

    var name = document.getElementsByName('user_name')[0].value;
    if (name.length) {
        var oReq = new XMLHttpRequest();
        oReq.addEventListener("load", authHandler);
        oReq.open("POST", "/signup", true);
        oReq.setRequestHeader("Content-type", "application/json");
        oReq.send(JSON.stringify({ user_name: name }));
    }

}

const createGameListener = function createGameHandler() {

    reqGames();

}

const createGame = function createGame() {

    var name = document.getElementsByName('game_name')[0].value;
    var nb = document.getElementsByName('nb_players')[0].value;

    if (["4", "5", "6", "7", "8"].includes(nb) && name.length) {
        var oReq = new XMLHttpRequest();
        oReq.addEventListener("load", createGameListener);
        oReq.open("POST", "/create_game", true);
        oReq.setRequestHeader("Content-type", "application/json");
        oReq.send(JSON.stringify(
            {
                game_name: name,
                nb_players: nb
            }
        ))
    }

}

function timeSince(date) {

  var seconds = Math.floor((new Date() - date) / 1000);

  var interval = Math.floor(seconds / 31536000);

  if (interval > 1) {
    return interval + " years";
  }
  interval = Math.floor(seconds / 2592000);
  if (interval > 1) {
    return interval + " months";
  }
  interval = Math.floor(seconds / 86400);
  if (interval > 1) {
    return interval + " days";
  }
  interval = Math.floor(seconds / 3600);
  if (interval > 1) {
    return interval + " hours";
  }
  interval = Math.floor(seconds / 60);
  if (interval > 1) {
    return interval + " minutes";
  }
  return Math.floor(seconds) + " seconds";
}

const reqGamesListener = function requestAvailableGamesHandler() {

    var gamelist = JSON.parse(this.responseText);

    var gld = document.getElementById('game_list');
    if (gld)
        gld.parentNode.removeChild(gld);

    var gamelistview = document.createElement('div');
    gamelistview.setAttribute('id', 'game_list');
    gamelistview.setAttribute('class', 'list-group');
    gamelistview.appendChild(document.createElement('hr'));

    for (var i = 0; i < gamelist.length; i++) {
        var a = document.createElement('a');
        var div = document.createElement('div');
        var h5 = document.createElement('h5');
        var smalldate = document.createElement('small');
        var p = document.createElement('p');
        var small = document.createElement('small');

        a.setAttribute('href', "/join_game/" + gamelist[i].id);
        a.setAttribute('class', "list-group-item list-group-item-action flex-column align-items-start");
        div.setAttribute('class', "d-flex w-100 justify-content-between");
        h5.setAttribute('class', 'mb-1');
        p.setAttribute('class', 'mb-1');

        h5.innerText = "Game: " + gamelist[i].name;
        smalldate.innerText = timeSince(new Date(gamelist[i].date)) + " ago";
        console.log(gamelist[i].date);
        p.innerText = "Players: " + gamelist[i].players.join();
        small.innerText = "(" + gamelist[i].players.length + "/" + gamelist[i].nb_players + ")";
        if (gamelist[i].players.length < gamelist[i].nb_players)
            small.innerText += " Waiting for more players..."
        else
            small.innerText += " Ongoing game."

        div.appendChild(h5);
        div.appendChild(smalldate);
        a.appendChild(div);
        a.appendChild(p);
        a.appendChild(small);
        gamelistview.appendChild(a);
    }

    var refNode = document.getElementById('createGame');
    refNode.parentNode.insertBefore(gamelistview, refNode.nextSibling);

}

const reqGames = function requestAvailableGames() {

    var oReq = new XMLHttpRequest();
    oReq.addEventListener("load", reqGamesListener);
    oReq.open("GET", "/games", true);
    oReq.setRequestHeader("Content-type", "application/json");
    oReq.send();

}