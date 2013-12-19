
var G = {
	base: 'https://awesomenaut-studios.firebaseIO.com/',
	user: null,
	auth: null
};

$(function(){
	setupLogin();
});

function setupLogin(){

	var msgId = "#login_message";
	var users = new Firebase(G.base);
	var auth = new FirebaseSimpleLogin(users, function(error, user){
		
		$(msgId).text("");
		
		if (error) {
    // an error occurred while attempting login
		$(msgId).text(error.message);
		/*
    switch(error.code) {
			
      case 'INVALID_EMAIL':
				$(msgId).text("");
      case 'INVALID_PASSWORD':
      default:
				console.log("Unhandled error code: " + error.code);
    }
		*/
		} else if (user) {
			// user authenticated with Firebase
			G.user = user;
			showScene("game");
			setupGame();
			//console.log('User ID: ' + user.id + ', Provider: ' + user.provider);
		} else {
			// user is logged out
			G.user = null;
			showScene('login');
		}
		
	});
	
	G.auth = auth;
	
	$("#show_login").click(function(){
		showScene('login');
		msgId = "#login_message";
	});
	
	$("#show_create_login").click(function(){
		showScene('create');
		msgId = "#create_login_message";
	});
	
	$("#login").click(function(){
		
		var email = $("#email").val();
		var password = $("#password").val();
		
		auth.login("password", {
			email: email,
			password: password
		});
			
	});
	
	$("#logout").click(function(){
		auth.logout();
	});
	
	$("#create_login").click(function(){
		
		var email = $("#email_create").val();
		var password = $("#password_create").val();
		var confPass = $("#confirm_password_create").val();
		
		if (password != confPass){
			$(msgId).text("Passwords must match.");
			return;
		}
		
		auth.createUser(email,password,function(error,user){
			if (!error){
				G.user = user;
			} else {
				$(msgId).text(error.message);
			}
		});
	});
}

function showScene(scene){

	var scenes = {
		'login': '#login_scene',
		'create': '#create_login_scene',
		'game': '#game_scene'
	};
	
	for(var s in scenes){
		if (s == scene)
			$(scenes[s]).show();
		else
			$(scenes[s]).hide();
	}

}

function setupGame(){

	var Q = Quintus().include("Sprites, Scenes, Input, 2D, Touch, UI").setup("game_scene").controls().touch();

  Q.scene("start", function(stage){
		
		stage.insert(new Q.UI.Button({
				label: "Log Out",
				y: 150,
				x: Q.width/2
			}, function() {
				G.auth.logout();
				showScene("login");
    }));

	});
	
	Q.load("blah.json",function(){
		Q.stageScene("start");
	});
}