import SearchDropdown from '../../SearchDropdown/SearchDropdown';

interface Artist {
    id: number;
    name: string;
}

interface Album {
    id: number;
    title: string;
    artist: Artist;
    cover_medium: string;
}

interface AlbumSearchProps {
    albumName: string;
    setAlbumName: (name: string) => void;
    albumResults: Album[];
    onSelect: (albumId: number) => void;
}

const AlbumSearch: React.FC<AlbumSearchProps> = ({
    albumName,
    setAlbumName,
    albumResults,
    onSelect,
}) => {
    return (
        <SearchDropdown<Album>
            value={albumName}
            setValue={setAlbumName}
            options={albumResults}
            onSelect={onSelect} // ✅ SearchDropdown вже повертає id, тому передаємо напряму
            optionLabel="title"
            getSubtext={(album) => album.artist.name}
        />
    );
};

export default AlbumSearch;
