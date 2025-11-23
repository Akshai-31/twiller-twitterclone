import React from "react";
import Badge from "@mui/material/Badge";
import "./Sidebaroption.css";

const Sidebaroption = ({ active, text, Icon, badgeCount }) => {
  return (
    <div className={`sidebarOptions ${active && "sidebarOptions--active"}`}>
      <div className="iconWrapper">
        {badgeCount > 0 ? (
          <Badge
            badgeContent={badgeCount}
            color="primary"
            overlap="circular"
            anchorOrigin={{
              vertical: "top",
              horizontal: "right",
            }}
          >
            <Icon />
          </Badge>
        ) : (
          <Icon />
        )}
      </div>

      <h2>{text}</h2>
    </div>
  );
};

export default Sidebaroption;