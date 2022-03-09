# Telescope — A meetings app that integrates everywhere

[Telescope](https://telescope.ml) is a WebRTC online video-calling platform that integrates with other services (for now, only Discord and Emails) to place calls between two people. Gone are the times of sharing weird links and passwords and signing up for accounts. Telescope uses the service to authenticate the user to ensure security and privacy.

Tech Stack:

- ExpressJS for backend
- NextJS for frontend
- Deno for integrations
- Everything is deployed on two azure VMs with Dokku and NGINX.

Github: https://github.com/arnu515/telescope
Hosted: https://telescope.ml

## Additional Resources / Info

Instructions for using the Discord integration:

- Create a new discord server / have administrator on an already existing discord server.
- Go to the [Explore Integrations](https://telescope.ml/integrations) page on Telescope and click the "Add" button on the Discord integration.
- You will be taken to Discord where you'll be asked to add the integration to the server
- Once that's done, simply type `/call` in the message box and mention a user to create a telescope call.
- Both users can open the link after which they'll be asked to log in to discord to verify that they have access to join the call.
- Once in, the call takes place peer-to-peer end-to-end encrypted.

Demo video: https://vimeo.com/686124422
