export const sendNotificationIfAllowed = (postText, posterEmail, loggedInUser) => {
  const toggle = localStorage.getItem("notifications");
  if (toggle !== "enabled") return;

  const following = loggedInUser?.following || [];
  if (!following.includes(posterEmail)) return;

  new window.Notification("New Tweet from Someone You Follow!", {
    body: postText,
    icon: "/logo192.png"
  });
};
