import iconImage from '../../../assets/icon.png';

export const HeaderLogo = () => {
    return (
        <div className="flex justify-center items-center p-2 h-10 rounded-lg">
            <img 
                src={iconImage} 
                alt="WildosVPN Icon" 
                className="h-8 w-8 object-contain"
            />
        </div>
    );
}
