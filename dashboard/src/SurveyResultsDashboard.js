import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, Typography, Accordion, AccordionSummary, AccordionDetails, CircularProgress, List, ListItem, ListItemText, Box, Alert } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import axios from 'axios';

function SurveyResultsDashboard() {
  const [surveys, setSurveys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const fetchSurveyResults = useCallback(async () => {
    // Only fetch if component is expanded (accordion open)
    if (!isExpanded && surveys.length > 0) {
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await axios.get('/api/surveys');
      setSurveys(response.data.reverse()); // Reverse to show newest first
    } catch (err) {
      console.error('Error fetching survey results:', err);
      setError('No se pudieron cargar los resultados de la encuesta.');
    } finally {
      setLoading(false);
    }
  }, [isExpanded, surveys.length]);

  useEffect(() => {
    // Only start polling when expanded
    if (isExpanded) {
      fetchSurveyResults();
      const interval = setInterval(fetchSurveyResults, 30000); // Refresh every 30 seconds (reduced from 10s)
      return () => clearInterval(interval);
    }
  }, [isExpanded, fetchSurveyResults]);

  const calculateStats = useMemo(() => {
    if (surveys.length === 0) {
      return { average: 0, distribution: {}, lowRatings: [] };
    }

    let totalRating = 0;
    const distribution = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    const lowRatings = [];

    surveys.forEach(survey => {
      totalRating += survey.rating;
      distribution[survey.rating]++;
      if (survey.rating <= 2) {
        lowRatings.push(survey);
      }
    });

    const average = (totalRating / surveys.length).toFixed(2);

    return { average, distribution, lowRatings };
  }, [surveys]); // Memoize calculation - only recalculate when surveys change

  const { average, distribution, lowRatings } = calculateStats;

  const handleAccordionChange = useCallback((event, expanded) => {
    setIsExpanded(expanded);
  }, []);

  return (
    <Card style={{ marginTop: '2rem' }}>
      <CardContent>
        <Accordion onChange={handleAccordionChange}>
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            aria-controls="survey-results-content"
            id="survey-results-header"
          >
            <Typography variant="h5">Dashboard de Resultados de Encuestas</Typography>
          </AccordionSummary>
          <AccordionDetails>
            {loading && <Box display="flex" justifyContent="center"><CircularProgress /></Box>}
            {error && <Alert severity="error">{error}</Alert>}
            {!loading && !error && surveys.length === 0 && (
              <Typography>No hay resultados de encuestas para mostrar.</Typography>
            )}
            {!loading && !error && surveys.length > 0 && (
              <Box>
                <Typography variant="h6">Estadísticas Generales</Typography>
                <Typography>Calificación Promedio: {average}</Typography>
                <Typography>Distribución de Calificaciones:</Typography>
                <List dense>
                  {Object.entries(distribution).map(([rating, count]) => (
                    <ListItem key={rating}>
                      <ListItemText primary={`Calificación ${rating}: ${count} veces`}
                      />
                    </ListItem>
                  ))}
                </List>

                {lowRatings.length > 0 && (
                  <Box mt={2}>
                    <Typography variant="h6" color="error">Calificaciones Bajas (0-2)</Typography>
                    <List dense>
                      {lowRatings.map((survey, index) => (
                        <ListItem key={index}>
                          <ListItemText
                            primary={`Cliente: ${survey.from} - Calificación: ${survey.rating}`}
                            secondary={`Fecha: ${new Date(survey.timestamp).toLocaleString()}`}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                )}
              </Box>
            )}
          </AccordionDetails>
        </Accordion>
      </CardContent>
    </Card>
  );
}

export default SurveyResultsDashboard;
