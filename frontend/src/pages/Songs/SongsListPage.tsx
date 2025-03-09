import { useGetSongsQuery } from "../../store/api/songsApi";


const SongsListPage: React.FC = () => {

    const { data: songs, error, isLoading, refetch } = useGetSongsQuery();

    const handleSongs = async () => {
      const result = await refetch(); // Виконує повторний запит при натисканні
      console.log(result);
    };

    const checkLocalStorage = () => {
      console.log(localStorage.getItem('accessToken'));
    }
   

    return (
      
      <div>
        <div>
          
          <button onClick={handleSongs}>
              GETSONGS!
          </button>
          <button className="btn btn-primary">Натисни мене</button>
          <button onClick={checkLocalStorage}>
            check localstor
          </button>
          {isLoading && <p>Loading...</p>}
          {error && <p>Error: {(error as any).message}</p>}

          <ul>
            {songs?.map((song) => (
              <li key={song.id}>{song.title}</li>
            ))}
          </ul>
         
        </div>
        
    </div>
    );
}
  
export default SongsListPage;
  