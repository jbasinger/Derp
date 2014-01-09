
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
			G.user = user.uid;
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
		
		G.user = auth.uid;
		
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
				G.user = user.uid;
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

	var Q = Quintus().include("Sprites, Scenes, Input, 2D, UI").setup("game_scene").controls();
	var fbPlayers = new Firebase(G.base + "players");
	
	Q.gravityX=0;
	Q.gravityY=0;
	
	Q.Sprite.extend("Derp", {
		init:function(p){
			this._super(p, {
				asset: "derp.png",
				color: "red",
				x:50,
				y:50
			});
			this.add("2d");
			
		}
	});
	
  Q.scene("start", function(stage){
		
		var myDerp = new Q.Derp();
		var otherDerps = [];
		
		myDerp.add("eventedStepControls");
		
		myDerp.on("stepping",this,function(pos){
			fbPlayers.child(G.user).set(pos);
		});
		
		fbPlayers.on("child_changed",function(data){
			
			if (data.name() == G.user)
				return;
			
			var leDerp = _.find(otherDerps,function(d){return d.p.uid==data.name();});
			var pos = data.val();
			leDerp.p.x=pos.x;
			leDerp.p.y=pos.y;
			
		});
		
		fbPlayers.once("value",function(data){
			console.log(data.val());
			_.each(data.val(),function(val, key){
				
				if (key == G.user){
					myDerp.p.x = val.x;
					myDerp.p.y = val.y;
					return;
				} else {
					var anotherDerp = new Q.Derp();
					anotherDerp.p.x = val.x;
					anotherDerp.p.y = val.y;
					anotherDerp.p.uid = key;
					otherDerps.push(anotherDerp);
					stage.insert(anotherDerp);
				}
				
			});
		});
		
		stage.insert(new Q.UI.Button({
				label: "Log Out",
				y: 10,
				x: Q.width-50
			}, function() {
				G.auth.logout();
				showScene("login");
    }));
		
		stage.collisionLayer(new Q.TileLayer({dataAsset: "test.tmx", layerIndex: 1, sheet: "tiles", tileW:32, tileH:32 }));
		stage.insert(new Q.TileLayer({dataAsset: "test.tmx", layerIndex: 0, sheet: "tiles", tileW:32, tileH:32, type: Q.SPRITE_NONE }));
		
		stage.insert(myDerp);
		stage.add("viewport").follow(myDerp);
		
	});
	
	Q.load("derp.png, test.tmx, dg_grounds32.png",function(){
		Q.sheet("tiles","dg_grounds32.png",{tileW:32, tileH:32});
		Q.stageScene("start");
	});
	
	/* Other components */
	Q.component("eventedStepControls", {

    added: function() {
      var p = this.entity.p;

      if(!p.stepDistance) { p.stepDistance = 32; }
      if(!p.stepDelay) { p.stepDelay = 0.2; }

      p.stepWait = 0;
      this.entity.on("step",this,"step");
      this.entity.on("hit", this,"collision");
    },

    collision: function(col) {
      var p = this.entity.p;

      if(p.stepping) {
        p.stepping = false;
        p.x = p.origX;
        p.y = p.origY;
				this.entity.trigger("stepping",{x:p.x,y:p.y});
      }

    },

    step: function(dt) {
      var p = this.entity.p,
          moved = false;
      p.stepWait -= dt;

      if(p.stepping) {
        p.x += p.diffX * dt / p.stepDelay;
        p.y += p.diffY * dt / p.stepDelay;
				this.entity.trigger("stepping",{x:p.x,y:p.y});
      }

      if(p.stepWait > 0) { return; }
      if(p.stepping) {
        p.x = p.destX;
        p.y = p.destY;
      }
      p.stepping = false;

      p.diffX = 0;
      p.diffY = 0;

      if(Q.inputs['left']) {
        p.diffX = -p.stepDistance;
      } else if(Q.inputs['right']) {
        p.diffX = p.stepDistance;
      }

      if(Q.inputs['up']) {
        p.diffY = -p.stepDistance;
      } else if(Q.inputs['down']) {
        p.diffY = p.stepDistance;
      }

      if(p.diffY || p.diffX ) {
        p.stepping = true;
        p.origX = p.x;
        p.origY = p.y;
        p.destX = p.x + p.diffX;
        p.destY = p.y + p.diffY;
        p.stepWait = p.stepDelay;
      }

    }

  });
}
