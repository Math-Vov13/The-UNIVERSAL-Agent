import { DotSquare } from 'lucide-react';
import React from 'react';

interface TransparentImageWithBackgroundProps {
    classname?: string; // Classe CSS optionnelle pour le conteneur
    children: React.ReactNode; // Contenu enfant optionnel
}

const TransparentImageWithBackground: React.FC<TransparentImageWithBackgroundProps> = ({
    classname,
    children,
}) => {
    // const containerStyle: React.CSSProperties = {
    //     width,
    //     height,
    //     display: 'flex',
    //     justifyContent: 'center',
    //     alignItems: 'center',
    //     // Si une image de fond est fournie, on l'utilise
    //     ...(backgroundImage ? {
    //         backgroundImage: `url(${backgroundImage})`,
    //         backgroundSize: 'cover', // Pour que l'image de fond couvre tout le conteneur
    //         backgroundPosition: 'center', // Centrer l'image de fond
    //     } : {
    //         // Sinon, on utilise la couleur de fond
    //         backgroundColor,
    //     }),
    //     position: 'relative', // Important pour positionner l'image si besoin
    //     overflow: 'hidden', // Pour cacher ce qui dépasse si l'image est trop grande
    // };

    const imageStyle: React.CSSProperties = {
        maxWidth: '100%', // Assure que l'image ne dépasse pas du conteneur
        maxHeight: '100%',
        objectFit: 'contain', // Redimensionne l'image pour qu'elle tienne dans le conteneur
    };

    return (
        <DotSquare size={48} className="text-gray-600 animate-pulse">
            <div className={classname}>
                {children}
            </div>
        </DotSquare>
    );
};

export default TransparentImageWithBackground;