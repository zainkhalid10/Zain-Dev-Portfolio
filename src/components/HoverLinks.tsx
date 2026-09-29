import "./styles/style.css";

const HoverLinks = ({ text, cursor }: { text: string; cursor?: boolean }) => {
  return (
    <div className="hover-link" data-cursor={!cursor && `disable`}>
      <div className="hover-in">
        {text} <div>{text}</div>
      </div>
      <span className="nav-link-line" />
    </div>
  );
};

export default HoverLinks;
