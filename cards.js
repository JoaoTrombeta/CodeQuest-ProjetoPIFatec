document.addEventListener('DOMContentLoaded', () => {
    const exStack = document.getElementById('execution-stack')
    const PArea = document.getElementById('player-area')


    var actualRAM = 3
    var MAXRAM = 3
    const RAMtext = document.getElementById('memory-text')


    var PlayerCards = []
    var QtdPlayerCards = 0

    fetch('cards.json')
        .then(response => response.json())
        .then(cartas => {
            var qtdCards = cartas.cards.length



            while (QtdPlayerCards < 5) {
                var RGN = Math.floor(Math.random() * qtdCards)

                PlayerCards.push(RGN)
                QtdPlayerCards++
            }
            PlayerCards.forEach(nomecarta => {
                const base = "div"
                base.ClassList.
                PArea.appendChild(base)
            });

        })
        .catch(erro => {
            console.error('Erro ao carregar JSON:', erro);
        });

    console.log(PlayerCards)
    RAMtext.textContent = actualRAM + '/' + MAXRAM
})