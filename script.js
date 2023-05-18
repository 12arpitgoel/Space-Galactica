window.addEventListener("resize",()=>location.reload());

window.addEventListener("load",start);

function start(){
    let canvas = document.querySelector(".canvas");
    let ctx = canvas.getContext("2d");

    canvas.width = window.innerWidth
    canvas.height = window.innerHeight-5;
    ctx.fillStyle = "black";
    ctx.font = "20px san-serif";

    const GameStatus={
        Lost:{
            status:"Game Over",
            message:"You Lost!"
        },
        Pause:{
            status:"Paused",
            message:"Press 'p' to Resume the game"
        },
        Play:{
            status:"Play",
            message:"Press 'p' to Pause the game"
        }
    }
    
    class UI{
        constructor(score=0, gameStatus=GameStatus.Play){
            this.x = 20;
            this.y = 40;
            this.size = 20;
            this.space = 30;

            this.score = score;
            this.gameStatus = gameStatus;
        }
        draw(ctx){
            ctx.fillText( "Score : "+this.score, this.x, this.y);
            
            if(this.gameStatus!=GameStatus.Play){
                ctx.save();
                ctx.textAlign = "center"
                ctx.font = "50px Impact";
                ctx.fillText(this.gameStatus.status, canvas.width*0.5, canvas.height*0.5-30);
                ctx.font = "30px san-serif";
                ctx.fillText(this.gameStatus.message, canvas.width*0.5, canvas.height*0.5+30);
                ctx.restore();
            }
            else{
                ctx.save();
                ctx.textAlign = "right"
                ctx.fillText(this.gameStatus.message, canvas.width - 20, this.y);
                ctx.restore();
            }
        }
        update(score, gameStatus){
            this.score = score;
            this.gameStatus = gameStatus
        }
    }

    class Bullet{
        constructor(x, y){
            this.speed = 5;
            this.width = 5;
            this.height = 10;

            this.x = x;
            this.y = y - this.height;
            this.markedForDeletion = false;
        }
        draw(ctx){
            ctx.fillRect(this.x, this.y, this.width, this.height);
        }
        update(){
            this.y -= this.speed;
            if(this.y<0) this.markedForDeletion = true;
        }
    }

    class Muzzle{
        constructor(x, y){
            this.x = x;
            this.y = y;

            this.interval = 0;
            this.duration = 50;
        }

        update(deltaTime, x){
            this.x = x;
            if(this.interval<this.duration){
                this.interval += deltaTime;
            }
            else{
                this.interval = 0;
                return new Bullet(this.x, this.y);
            }
        }
    }

    class SpaceShip{
        constructor(){
            this.width = 50;
            this.height = 50;
            this.x = (canvas.width - this.width)/2;
            this.y = canvas.height - this.height;
            this.speed = 20;
            this.muzzles = [];
            let gap = -20;

            for(let i = 0; i<5; gap+=(i<2)?10:-10, i++ ){
                let muzzle = new Muzzle(this.x + 2.5 + i*10, this.y + gap);
                this.muzzles.push(muzzle);
            }
        }

        draw(ctx){
            ctx.fillRect(this.x, this.y, this.width, this.height);
        }

        update(deltaTime){
            let bullets = this.muzzles.map((muzzle, idx)=> muzzle.update(deltaTime, this.x + 2.5 + idx*10));
            return bullets.filter(bullet=> bullet!=null);
        }

        move(x){
            this.x = x - this.width/2;
        }

        goLeft(){
            this.x -= this.speed;
            if(this.x<0) this.x=0;
        }

        goRight(){
            this.x += this.speed;
            if(this.x+this.width>canvas.width) this.x = canvas.width-this.width;
        }

    }

    class Meteorite{
        constructor(){
            this.score = 300+Math.ceil(Math.random()*1699);
            // console.log(this.score)
            this.x = 20;
            this.y = 70;
            this.size = 100;


            this.horizontal = 5;
            this.vertical = -2;
            this.ac = 0.3;
            this.markedForDeletion = false;
        }
        draw(ctx){
            ctx.fillRect(this.x, this.y, this.size, this.size);
            ctx.save();
            ctx.textAlign = "center";
            ctx.fillStyle = "white";
            ctx.fillText(this.score,this.x + this.size*0.5, this.y + this.size*0.6);
            ctx.restore();
        }
        update(){
            if(this.x <= 0 || (this.x+this.size >= canvas.width)){
                this.horizontal = -this.horizontal;
            }
            

            if(this.y + this.size >= canvas.height ){
                if(this.vertical<14)this.vertical=14
                this.vertical = -this.vertical;
            }
            // console.log(this.vertical)
            this.vertical += this.ac;
            this.y += this.vertical;
            this.x += this.horizontal;
        }
    }

    class Game{
        constructor(spaceShip){
            this.score = 0;
            this.gameStatus = GameStatus.Play;
            this.ui = new UI(this.score, this.gameStatus);

            this.spaceShip = spaceShip;
            this.damage = 10;
            this.bullets = [];

            this.meteorites = [];
            this.meteoriteDuration = 2000;
            this.meteoriteInterval = 0;
        }
        draw(ctx){
            this.ui.draw(ctx);
            this.spaceShip.draw(ctx);
            this.bullets.map(bullet=>bullet.draw(ctx));
            this.meteorites.map(meteorite=>meteorite.draw(ctx));
        }

        update(deltaTime){
            this.ui.update(this.score, this.gameStatus);

            if(this.gameStatus!=GameStatus.Play) return;
            
            this.updateBullets(deltaTime);
            this.updateMeteorites(deltaTime);
            this.handleCollission();
            this.handleSpaceShipCollission();
            
        }

        handleSpaceShipCollission(){
            this.meteorites.map(meteorite=>{
                if(this.spaceShip.x+this.spaceShip.width>=meteorite.x && this.spaceShip.x<=meteorite.x+meteorite.size){
                    if(this.spaceShip.y+this.spaceShip.height>=meteorite.y && this.spaceShip.y<=meteorite.y+meteorite.size){
                        this.gameStatus = GameStatus.Lost;
                    }
                }
            })
        }

        handleCollission(){
            this.meteorites.map(meteorite=>{
                this.bullets.map(bullet=>{
                    if(bullet.x+bullet.width>=meteorite.x && bullet.x<=meteorite.x+meteorite.size){
                        if(bullet.y+bullet.height>=meteorite.y && bullet.y<=meteorite.y+meteorite.size){
        
                            bullet.markedForDeletion = true;
                            meteorite.score -= this.damage;
                            this.score += this.damage;

                            if(meteorite.score<=0){
                                meteorite.markedForDeletion = true;
                            }
                        }
                    }
                })
            })
        }
        
        updateMeteorites(deltaTime){
            this.meteorites.map(meteorite=>meteorite.update());
            this.meteorites = this.meteorites.filter(meteorite=>!meteorite.markedForDeletion);

            if(this.meteorites.length>=5) return;
            // console.log(this.meteorites)
            
            if(this.meteoriteInterval>Math.random()*10000+this.meteoriteDuration){
                this.meteoriteInterval = 0;
                let meteorite = new Meteorite();
                this.meteorites.push(meteorite);
            }
            else{
                this.meteoriteInterval += deltaTime;
            }
        }

        updateBullets(deltaTime){
            let newBullets = this.spaceShip.update(deltaTime);
            
            this.bullets.push(...newBullets);
            
            this.bullets.map(bullet=>bullet.update());
            this.bullets = this.bullets.filter(bullet=>!bullet.markedForDeletion);
        }

    }

    class InputHandler{
        constructor(game, spaceShip){

            window.addEventListener("keydown", (e)=>{
                // console.log(e);
                if(e.key === "ArrowLeft"){
                    if(game.gameStatus != GameStatus.Play) return;
                    spaceShip.goLeft();
                }
                else if(e.key === "ArrowRight"){
                    if(game.gameStatus != GameStatus.Play) return;
                    spaceShip.goRight();
                }
                else if(e.key === "p" || e.key === " "){
                    if(game.gameStatus == GameStatus.Lost) return;
                    game.gameStatus = (game.gameStatus==GameStatus.Play)? GameStatus.Pause: GameStatus.Play;
                }
            })

            window.addEventListener("mousemove",e=>{
                if(game.gameStatus != GameStatus.Play) return;
                let x = e.clientX;
                spaceShip.move(x)
            })
        }
    }

    let spaceShip = new SpaceShip();
    let game = new Game(spaceShip);
    new InputHandler(game, spaceShip);
    
    function animate(timestamp){
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        let deltaTime = timestamp - lastlyAdded;
        lastlyAdded = timestamp;

        game.update(deltaTime);
        game.draw(ctx);
        requestAnimationFrame(animate)
    }

    let lastlyAdded = 0;
    animate(0);
}
