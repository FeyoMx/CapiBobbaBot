import React from 'react';
import { Container, AppBar, Toolbar, Typography } from '@mui/material';
import MaintenanceMode from './MaintenanceMode';
import BusinessDataEditor from './BusinessDataEditor';
import MessageLogViewer from './MessageLogViewer';
import OrderViewer from './OrderViewer';
import ChatInterface from './ChatInterface';
import RedisStateViewer from './RedisStateViewer';
import SurveyResultsDashboard from './SurveyResultsDashboard';

function App() {
  return (
    <div>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6">
            CapiBobba Bot Dashboard
          </Typography>
        </Toolbar>
      </AppBar>
      <Container sx={{ mt: 2 }}>
        <MaintenanceMode />
        <BusinessDataEditor />
        <MessageLogViewer />
        <OrderViewer />
        <ChatInterface />
        <RedisStateViewer />
        <SurveyResultsDashboard />
      </Container>
    </div>
  );
}

export default App;
