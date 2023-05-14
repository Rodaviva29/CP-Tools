module.exports = function formatStationName(stationName) {
    const stationNameWords = stationName.split('-');
    const formattedWords = stationNameWords.map(word => {
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    });
    return formattedWords.join('-');
}