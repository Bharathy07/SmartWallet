# TODO

- [x] Implement backend wallet top-up endpoint (POST `/api/wallet/top-up`), updating `User.balance` and recording an allowed transaction for charting.
- [x] Update backend routes to register the new endpoint.
- [x] Add frontend “Top up wallet” section on `frontend/src/pages/Profile.jsx` (user requested Profile) with amount input + submit.
- [x] Ensure success/error UI and refresh balance after top-up.
- [ ] Quick manual test: top-up increases balance and appears as credited (green) in weekly chart.


