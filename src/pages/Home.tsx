import { Link } from 'react-router-dom';
import './Home.css';

export default function Home() {
  return (
    <div className="home-container">
      <header className="home-hero">
        <div className="home-hero-content">
          <h1 className="home-title">Bem-vindo ao Acervo Artístico 3D</h1>
          <p className="home-subtitle">
            Uma janela digital para a coleção de arte da UFSM.
          </p>
          <Link to="/galeria" className="home-cta-button">
            Explore a Galeria
          </Link>
        </div>
      </header>

      <section className="home-section">
        <h2 className="home-section-title">Sobre o Projeto</h2>
        <p className="home-description">
          Este projeto visa digitalizar e disponibilizar o acervo artístico da Universidade Federal de Santa Maria em formato 3D, permitindo a exploração interativa e detalhada de cada obra. Nossa missão é preservar e democratizar o acesso à cultura e à arte.
        </p>
      </section>

      <section className="home-section home-featured-section">
        <h2 className="home-section-title">Destaques</h2>
        <div className="home-featured-items">
          {/* Exemplo de item em destaque. Isso pode ser dinâmico no futuro. */}
          <div className="home-featured-item">
            <div className="home-featured-item-image-placeholder"></div>
            <h3 className="home-featured-item-title">Obra em Destaque 1</h3>
            <p className="home-featured-item-artist">Nome do Artista</p>
          </div>
          <div className="home-featured-item">
            <div className="home-featured-item-image-placeholder"></div>
            <h3 className="home-featured-item-title">Obra em Destaque 2</h3>
            <p className="home-featured-item-artist">Nome do Artista</p>
          </div>
          <div className="home-featured-item">
            <div className="home-featured-item-image-placeholder"></div>
            <h3 className="home-featured-item-title">Obra em Destaque 3</h3>
            <p className="home-featured-item-artist">Nome do Artista</p>
          </div>
        </div>
      </section>
    </div>
  );
}
