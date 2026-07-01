let cards;
let currentCard;
let state = 0;

fetch("cards.json")
.then(r => r.json())
.then(data => cards = data);

const card = document.getElementById("card");
const content = document.getElementById("cardContent");

document.querySelectorAll("button").forEach(button=>{

    button.onclick=()=>{

        if(state!==0)return;

        const stack=button.dataset.stack;

        const list=cards[stack];

        currentCard=list[Math.floor(Math.random()*list.length)];

        card.classList.remove("hidden");

        setTimeout(()=>{
            card.classList.add("show");
            content.innerHTML=currentCard.question;
            state=1;
        },50);

    }

});

card.onclick=()=>{

    if(state===1){

        if(currentCard.answer===""){
            hideCard();
        }else{
            content.innerHTML=currentCard.answer;
            state=2;
        }

    }else if(state===2){

        hideCard();

    }

}

function hideCard(){

    card.classList.remove("show");

    setTimeout(()=>{
        card.classList.add("hidden");
        state=0;
    },400);

}
