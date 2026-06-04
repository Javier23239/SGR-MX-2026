import NavbarPublic from "../../components/public/NavbarPublic";
import Hero from "../../components/public/Hero";
import Nosotros from "../../components/public/Nosotros";
import Tecnologias from "../../components/public/Tecnologias";
import Servicio from "../../components/public/Servicio";
import Footer from "../../components/public/Footer";
import ChatBot from "../../components/chatbot/ChatBot"; 

const Home = () => {
  return (
    <>
      <NavbarPublic />

      <section id="inicio">
        <Hero />
      </section>

      <section id="nosotros">
        <Nosotros />
      </section>

      <section id="tecnologias">
        <Tecnologias />
      </section>

      <section id="servicio">
        <Servicio />
      </section>

      <Footer />

      <ChatBot /> 
    </>
  );
};

export default Home;