export const YouTubeEmbed = ({ videoUrl }: { videoUrl: string }) => {
    const videoId = videoUrl.split('v=')[1]?.split('&')[0];
    console.log("Video ID:", videoId);

    if (!videoId) {
        return;
    }

    return (
        <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0 }}>
            <iframe
                src={`https://www.youtube.com/embed/${videoId}`}
                title="YouTube video player"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                }}
            ></iframe>
        </div>
    );
};