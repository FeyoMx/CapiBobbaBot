import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  Chip,
  Box,
  Divider,
} from '@mui/material';
import CampaignIcon from '@mui/icons-material/Campaign';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PauseCircleIcon from '@mui/icons-material/PauseCircle';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

function CampaignList({ campaigns, selectedCampaignId, onSelectCampaign, loading }) {
  if (loading) {
    return (
      <Card>
        <CardContent>
          <Box sx={{ textAlign: 'center', py: 3 }}>
            <Typography variant="body2" color="text.secondary">
              Cargando campanas...
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  if (!campaigns || campaigns.length === 0) {
    return (
      <Card>
        <CardContent>
          <Box sx={{ textAlign: 'center', py: 3 }}>
            <CampaignIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
            <Typography variant="body1" color="text.secondary">
              No hay campanas disponibles
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent sx={{ p: 0 }}>
        <Box sx={{ p: 2, pb: 1 }}>
          <Typography variant="h6" component="div" sx={{ fontWeight: 600 }}>
            Campanas ({campaigns.length})
          </Typography>
        </Box>
        <Divider />
        <List sx={{ py: 0 }}>
          {campaigns.map((campaign, index) => (
            <React.Fragment key={campaign.id}>
              <ListItem disablePadding>
                <ListItemButton
                  selected={selectedCampaignId === campaign.id}
                  onClick={() => onSelectCampaign(campaign.id)}
                  sx={{
                    py: 2,
                    '&.Mui-selected': {
                      backgroundColor: 'primary.light',
                      '&:hover': {
                        backgroundColor: 'primary.light',
                      },
                    },
                  }}
                >
                  <ListItemIcon>
                    {campaign.active ? (
                      <CheckCircleIcon color="success" />
                    ) : (
                      <PauseCircleIcon color="disabled" />
                    )}
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="subtitle1" component="span" sx={{ fontWeight: 600 }}>
                          {campaign.name}
                        </Typography>
                        {campaign.active ? (
                          <Chip label="Activa" size="small" color="success" />
                        ) : (
                          <Chip label="Pausada" size="small" color="default" />
                        )}
                      </Box>
                    }
                    secondary={
                      <Box sx={{ mt: 0.5 }}>
                        <Typography variant="caption" display="block" color="text.secondary">
                          {campaign.description}
                        </Typography>
                        <Typography variant="caption" display="block" color="text.secondary">
                          Creada: {format(new Date(campaign.created), "d 'de' MMMM, yyyy", { locale: es })}
                        </Typography>
                        {campaign.stats && (
                          <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
                            <Typography variant="caption" sx={{ color: 'primary.main' }}>
                              {campaign.stats.totalSent} enviados
                            </Typography>
                            <Typography variant="caption" sx={{ color: 'success.main' }}>
                              {campaign.stats.delivered} entregados
                            </Typography>
                            <Typography variant="caption" sx={{ color: 'info.main' }}>
                              {campaign.stats.read} leidos
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    }
                  />
                </ListItemButton>
              </ListItem>
              {index < campaigns.length - 1 && <Divider />}
            </React.Fragment>
          ))}
        </List>
      </CardContent>
    </Card>
  );
}

export default CampaignList;
