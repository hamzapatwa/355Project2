function createShareableScoreCard(score, totalQuestions, percentage, category, difficulty) {
    const card = document.createElement('div');
    card.className = 'shareable-score-card';
    card.style.cssText = `
        background-color: #ffffff;
        border-radius: 12px;
        padding: 20px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        font-family: 'Press Start 2P', 'Courier New', monospace;
        color: #333;
        width: 400px;
        margin: 0;
        display: block;
        position: relative;
        box-sizing: border-box;
    `;

    card.innerHTML = `
        <div style="text-align: center; margin-bottom: 20px;">
            <h2 style="font-size: 24px; margin-bottom: 20px; color: #e52521; font-family: 'Press Start 2P', 'Courier New', monospace;">Quiz Results</h2>
            <div style="display: flex; justify-content: center; gap: 20px; margin-bottom: 20px;">
                <div style="font-size: 32px; font-weight: bold; font-family: 'Press Start 2P', 'Courier New', monospace;">${score}/${totalQuestions}</div>
                <div style="font-size: 32px; font-weight: bold; color: #e52521; font-family: 'Press Start 2P', 'Courier New', monospace;">${percentage}%</div>
            </div>
            <div style="margin-bottom: 20px; font-family: 'Press Start 2P', 'Courier New', monospace;">
                <p style="margin: 5px 0; font-size: 14px;">Category: ${category || 'Mixed'}</p>
                <p style="margin: 5px 0; font-size: 14px;">Difficulty: ${difficulty || 'Mixed'}</p>
            </div>
            <div style="font-size: 14px; color: #666; font-family: 'Press Start 2P', 'Courier New', monospace;">
                <p>Play QuizBlox!</p>
            </div>
        </div>
    `;
    return card;
}

async function shareScore(score, totalQuestions, percentage, category, difficulty) {
    try {
        // Create the score card
        const scoreCard = createShareableScoreCard(score, totalQuestions, percentage, category, difficulty);

        // Add the card to the document temporarily
        document.body.appendChild(scoreCard);

        // Wait for fonts to load
        await document.fonts.ready;

        // Ensure the card is visible and properly sized
        scoreCard.style.position = 'absolute';
        scoreCard.style.left = '0';
        scoreCard.style.top = '0';
        scoreCard.style.width = '400px';
        scoreCard.style.height = 'auto';
        scoreCard.style.visibility = 'visible';
        scoreCard.style.opacity = '1';
        scoreCard.style.zIndex = '9999';

        // Generate the image with specific options
        const dataUrl = await htmlToImage.toPng(scoreCard, {
            quality: 1.0,
            pixelRatio: 2,
            backgroundColor: '#ffffff',
            width: 400,
            height: scoreCard.offsetHeight,
            style: {
                'font-family': "'Press Start 2P', 'Courier New', monospace",
                'transform': 'none'
            },
            filter: (node) => {
                return !(node.tagName === 'LINK' && node.rel === 'stylesheet');
            }
        });

        // Remove the temporary card
        document.body.removeChild(scoreCard);

        // Create a blob from the data URL
        const blob = await (await fetch(dataUrl)).blob();
        const file = new File([blob], 'quizblox-score.png', { type: 'image/png' });

        // Share the image
        if (navigator.share) {
            await navigator.share({
                title: 'My QuizBlox Score',
                text: `I scored ${score}/${totalQuestions} (${percentage}%) on QuizBlox!`,
                files: [file]
            });
        } else {
            // Fallback for browsers that don't support the Web Share API
            const link = document.createElement('a');
            link.href = dataUrl;
            link.download = 'quizblox-score.png';
            link.click();
        }
    } catch (error) {
        console.error('Error sharing score:', error);
        alert('Could not share score. Please try again.');
    }
}

// Add event listener to share button
document.addEventListener('DOMContentLoaded', function() {
    const shareButton = document.getElementById('shareScore');
    if (!shareButton) return;

    shareButton.addEventListener('click', async function() {
        try {
            // Get the score data from the existing card
            const scoreCard = document.querySelector('.shareable-score-card');
            const scoreText = scoreCard.querySelector('.share-score').textContent;
            const [score, totalQuestions] = scoreText.split('/');
            const percentage = scoreCard.querySelector('.share-percentage').textContent.replace('%', '');
            const category = scoreCard.querySelector('.share-details p:first-child').textContent.replace('Category: ', '');
            const difficulty = scoreCard.querySelector('.share-details p:last-child').textContent.replace('Difficulty: ', '');

            await shareScore(score, totalQuestions, percentage, category, difficulty);
        } catch (error) {
            console.error('Error sharing score:', error);
            alert('Sorry, there was an error sharing your score. Please try again.');
        }
    });
});