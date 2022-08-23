const jumbotron = document.getElementById("jumbotron");
const dashNodeList = document.querySelectorAll(".dash");
const pathNodeList = document.querySelectorAll(".path");
const duration = [3, 3, 6, 6, 3, 8, 3, 3, 2, 6];
const dashLengths = [.05, .05, .02, .02, .04, .02, .06, .04, .15, .03];

let animationCount = 0;

function beginJourney(e) {
    if(!animationCount) {
        dashNodeList.forEach( (pathEl, i) => {
            pathEl.setAttribute("style", `stroke-dasharray: ${dashLengths[i]}`);
        })

        let delay;
        pathNodeList.forEach( (pathEl, i) => {
            pathEl.setAttribute("style", `animation: dash ${duration[i]}s linear ${delay ? `${delay}s ` : ""}forwards; stroke-dasharray: 1; stroke-dashoffset: 1;`); 
            if(i === 0) {
                delay = duration[i];
            } else {
                delay += duration[i];
            }
        })
    }
    animationCount++;
}

jumbotron.addEventListener('mouseenter', beginJourney);
