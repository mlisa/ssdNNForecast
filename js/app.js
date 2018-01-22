
function training(){

    //Configurazione rete neurale
    
    bimestral = document.getElementById("bim").checked
    annual = document.getElementById("ann").checked 

    //Creazione della rete neurale - struttura personalizzata
    if(!bimestral && !annual){
        var nInputs = parseInt(document.getElementById("inputN").value);
        var nHidden = parseInt(document.getElementById("hiddenN").value);
        var nOutput = parseInt(document.getElementById("outputN").value); 
        WINDOW_SIZE = nInputs

        network = ENCOG.BasicNetwork.create([
            ENCOG.BasicLayer.create(ENCOG.ActivationSigmoid.create(), nInputs, 0),
            ENCOG.BasicLayer.create(ENCOG.ActivationSigmoid.create(), nHidden, 1),
            ENCOG.BasicLayer.create(ENCOG.ActivationSigmoid.create(), nOutput, 1)
        ]);

        var trainingSet = createTrainingData();

    //Creazione della rete neurale - struttura predefinita
    } else {
        
        network = ENCOG.BasicNetwork.create([
            ENCOG.BasicLayer.create(ENCOG.ActivationSigmoid.create(), 2, 0),
            ENCOG.BasicLayer.create(ENCOG.ActivationSigmoid.create(), 2, 1),
            ENCOG.BasicLayer.create(ENCOG.ActivationSigmoid.create(), 1, 1)
        ]);
        WINDOW_SIZE = 2 

        if(annual){
            var trainingSet = createTrainingDataAnnual();
        } else {
            var trainingSet = createTrainingDataBimestral();
        }

    }

    //Inizializzazione random dei pesi
    network.randomize();

    //Generazione dei dati di training tramite sliding window
    var train = ENCOG.PropagationTrainer.create(network, trainingSet.mainInput, trainingSet.mainOutput,"BPROP",0.2,0.8);

    //Iterazioni di addestramento della rete
    var iteration = 0;
    do
    {   
        train.iteration();
        iteration++;
    } while(train.error > 0.008 && iteration < 500000);

    console.log("Training done: " + network.evaluate(trainingSet.mainInput, trainingSet.mainOutput) + " after " + iteration + " iterations")
    alert("Training completato!")
    document.getElementById("pred").disabled = false;
    document.getElementById("train").disabled = true;

    
}

//Creazione dei dati di training personalizzati, dove a partire dagli ultimi WINDOW_SIZE elementi si prevede il successivo
function createTrainingData(){

    //Matrice con gli array di input di addestramento
    var mainInput = [];
    //Matrice con i valori di output di addestramento
    var mainOutput = [];

    //Creazione tramite sliding window dei training data su cui addestrare la rete neurale
    for(var i = 0; i + WINDOW_SIZE < timeSeries.length; i++){
        var input = [];
        //Creo la sliding window
        for(var j = i; j < i + WINDOW_SIZE; j++){
            input.push(timeSeries[j])
        }
        mainInput.push(input)
        var output = timeSeries[i + WINDOW_SIZE]
        mainOutput.push([output])
    }
    
    return {mainInput, mainOutput}
}

//Creazione dei dati di training per una serie bimestrale
function createTrainingDataBimestral(){

    //Matrice con gli array di input di addestramento
    var mainInput = [];
    //Matrice con i valori di output di addestramento
    var mainOutput = [];

    //Creazione tramite sliding window dei training data su cui addestrare la rete neurale
    for(var i = 0; i + 6 < timeSeries.length; i++){
        var input = [];
        
        input.push(timeSeries[i])
        input.push(timeSeries[i+5])
        
        mainInput.push(input)
        var output = timeSeries[i + 6]
        mainOutput.push([output])
    }
    return {mainInput, mainOutput}
}

//Creazione dei dati di training per una serie annuale
function createTrainingDataAnnual(){

    //Matrice con gli array di input di addestramento
    var mainInput = [];
    //Matrice con i valori di output di addestramento
    var mainOutput = [];

    //Creazione tramite sliding window dei training data su cui addestrare la rete neurale
    for(var i = 0; i + 12 < timeSeries.length; i++){
        var input = [];
        
        input.push(timeSeries[i])
        input.push(timeSeries[i+11])
        
        mainInput.push(input)
        var output = timeSeries[i + 12]
        mainOutput.push([output])
    }
    return {mainInput, mainOutput}
}


function forecast(){

    var prediction = []
    var index = timeSeries.length

    //Leggo da interfaccia quanti valori deve prevedere la rete neurale
    nValues = parseInt(document.getElementById("valN").value); 

    if(bimestral){
        var currentData = []
        for(var i = 0; i < 6; i++){
            currentData.push(timeSeries[index - 6 + i])
        }

        for(var i = 0; i < nValues; i++){
            var input = []
            input.push(currentData[i])
            input.push(currentData[i+5])
            
            var output = []

            network.compute(input, output)
            currentData.push(output)
            prediction.push(output)
        }

    } else if(annual) { 
        var currentData = []
        for(var i = 0; i < 12; i++){
            currentData.push(timeSeries[index - 12 + i])
        }

        for(var i = 0; i < nValues; i++){
            var input = []
            input.push(currentData[i])
            input.push(currentData[i+11])
            var output = []

            network.compute(input, output)
            currentData.push(output)
            prediction.push(output)
        }
    } else {
        //Prendo gli ultimi N valori da passare alla rete neurale per prevedere i successivi
        var currentData = []
        for(var i = 0; i < WINDOW_SIZE; i++){
            currentData.push(timeSeries[index - WINDOW_SIZE + i])
        }
        //Computo per ogni valore desiderato il valore predetto
        for(var i = 0; i < nValues; i++){
            var input = []
            for(var j = 0; j <= WINDOW_SIZE; j++){
                input.push(currentData[i+j])
            }
            var output = []

            network.compute(input, output)
            currentData.push(output)
            prediction.push(output)
        }
    }

    if(hasBeenLog){
        prediction = denorm(prediction)
        prediction = eS(prediction)
    } else if(hasBeenDiff){
        prediction = denorm(prediction)
        prediction = deDiff(prediction)
    } else if(hasBeenDeSeason){
        prediction = denorm(prediction)
        prediction = deSeasonalAdjustment(prediction)
    } else {
        prediction = denorm(prediction)
    }
 
    //li aggiungo al grafico 
    addToChart(prediction)
    
    prediction.forEach(el => {
        document.getElementById("res").textContent = document.getElementById("res").textContent + "\n"+ el
    }) 


}

//Applica il logaritmo e mostra il risultato sul grafico secondario
function runDeseason(n){
    nSeason = n
    timeSeries = seasonalAdjustment(timeSeries)
    seasonTimeSeries = timeSeries
    hasBeenDeSeason = true
    resetChart(chart2, timeSeries)
}

//Applica la differenziazione e mostra il risultato sul grafico secondario
function runDiff(){
    timeSeries = diff(timeSeries)
    diffTimeSeries = timeSeries
    hasBeenDiff = true
    resetChart(chart2, timeSeries)
}

//Applica il logaritmo e mostra il risultato sul grafico secondario
function runLog(){
    timeSeries = logS(timeSeries)
    logTimeSeries = timeSeries
    hasBeenLog = true
    resetChart(chart2, timeSeries)

}

//Applica la normalizzazione e mostra il risultato sul grafico secondario
function runNorm(){
    timeSeries = norm(timeSeries)    
    hasBeenNorm = true
    resetChart(chart2, timeSeries)
}

//Resetta allo stato iniziale la serie e il grafico secondario
function runReset(){
    timeSeries = fixedTimeSeries 
    hasBeenLog = false
    hasBeenNorm = false
    hasBeenDiff = false
    hasBeenDeSeason = false
    resetChart(chart2, timeSeries)
}
