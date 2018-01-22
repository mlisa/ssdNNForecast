//Funzione per il caricamento del file csv
function handleFiles(files){
    var csv = files[0]

    if(csv.type != "text/csv"){
        alert("Please load a CSV file! Not a " + csv.type)
    } else 
    {
        Papa.parse(csv, {
            dynamicTyping : true,
            complete: function(result){                
                createCharts(result.data)
            }
        });
    }
}

//Funzione che crea i grafici a partire da dati in input
function createCharts(data){
    var title = data.shift();
    var labelsData = [];
    timeSeries = [];

    data.forEach(element => {
        labelsData.push(element[0])
    });

    data.forEach(element => {
        timeSeries.push(element[1])
    });

    fixedTimeSeries = timeSeries

    var ctx1 = document.getElementById("chart");

    chart = new Chart(ctx1, {
        type: 'line',
        data: {
            labels : labelsData,
            datasets : [{
                label : title[1],
                data: fixedTimeSeries,
                backgroundColor: [
                    'rgba(63, 127, 191, 0.2)',
                ]
            }]
        }
    });

    var ctx2 = document.getElementById("chart2");

    chart2 = new Chart(ctx2, {
        type: 'line',
        data: {
            labels : labelsData,
            datasets : [{
                label : title[1],
                data: timeSeries,
                backgroundColor: [
                    'rgba(117, 209, 209, 0.2)',
                ]
            }]
        }
    });
}

//Funzione che aggiunge nuovi dati al grafico principale
function addToChart(newData){

    newData.forEach(element => {
        chart.data.datasets[0].data.push(element)
        chart.data.labels.push("-")
    });


    chart.update()
}

//Funzione che resetta un grafico con i nuovi dati
function resetChart(currChart, newData){
    currChart.data.datasets[0].data = [];

    newData.forEach(element => {
        currChart.data.datasets[0].data.push(element)
    });

    currChart.update()
}

//Funzione che effettua la differenziazione della serie in input
function diff(series){
    var newSeries = [];
    for(var i = 1; i < series.length; i++){
        newSeries[i-1] = series[i] - series[i-1]
    }
    return newSeries

}

//Funzione che fa l'inversa della differenziazione della serie in input
function deDiff(series){
    var newSeries = [];
    newSeries[0] = fixedTimeSeries[fixedTimeSeries.length - 1] + series[0]
    for(var i = 1; i < series.length; i++){
        newSeries[i] = newSeries[i-1] + series[i]
    }
    return newSeries

}

//Funzione che applica il logaritmo ai dati per normalizzarli
function logS(series){
    var newSeries = [];
    for(var i = 0; i < series.length; i++){
        newSeries[i] = Math.log(series[i])
    }
    return newSeries

}

//Funzione che applica l'inversa del logaritmo (esponenziale)
function eS(series){
    var newSeries = [];
    for(var i = 0; i < series.length; i++){
        newSeries[i] = Math.pow(Math.E, series[i])
    }
    return newSeries

}

//Funzione che normalizza i dati tra 0 e 1 
function norm(series){
    var normSeries = []
    var min = Math.min(...series)
    var max = Math.max(...series)
    series.forEach(el => {

        z = (el - min) / (max - min)

        normSeries.push(z)
    });

    return normSeries

}

function seasonalAdjustment(series){

    var MA = []
    for(i = 0; i < series.length - nSeason; i++){
        var sum = 0;
        for(j = i; j < i + nSeason; j++){
            sum += series[j]
        }
        MA.push(sum/nSeason)
    }

    var baseline = []

    for(i = 0; i < MA.length - 1; i++){
        baseline.push((MA[i] + MA[i+1])/2)
    }

    var strt = []

    for(i = 0; i < baseline.length; i++){
        strt.push(series[i+nSeason/2] / baseline[i])
    }

    for(i = 0; i < nSeason; i++){
        var sum = 0
        var n = 0;
        for(j = i; j < strt.length; j += nSeason ){
            sum += strt[j]
            n++
        }
        st[(nSeason/2+i)%nSeason] = sum/n
    }

    var deseasonalSeries = []

    for(i = 0; i < series.length; i++){
        deseasonalSeries.push(series[i]/st[i%nSeason])
    }

    return deseasonalSeries

}

function deSeasonalAdjustment(series){

    var currSeason = timeSeries.length%nSeason 
    
    var seasonSeries = []

    for(i = 0; i < series.length; i++){
        seasonSeries.push(series[i]*st[(currSeason+i)%nSeason])
    }

    return seasonSeries
}

//Funzione che riporta i dati nel range originale
function denorm(series){
    var denormSeries = [];
    var max;
    var min;
    if(hasBeenDiff){
        max = Math.max(...diffTimeSeries)
        min = Math.min(...diffTimeSeries)
    } else if (hasBeenLog){
        max = Math.max(...logTimeSeries)
        min = Math.min(...logTimeSeries)
    } else {
        max = Math.max(...fixedTimeSeries)
        min = Math.min(...fixedTimeSeries)
    }

    series.forEach(el => {
        denormSeries.push(el * (max - min) + min)
    });
	return denormSeries;
}


