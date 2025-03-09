import React from "react";
import { Image } from "react-bootstrap";


interface AvatarPreviewProps {
  previewAvatar?: string;
  user?: { avatar?: string };
}

const AvatarPreview: React.FC<AvatarPreviewProps> = ({ previewAvatar, user }) => {
  return (
    <div className="text-center mb-3">
      <Image src={previewAvatar || user?.avatar} roundedCircle width={120} height={120} />
    </div>
  );
};

export default AvatarPreview;