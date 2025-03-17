import React, { useEffect, useState } from 'react';
import {
  Typography,
  Paper,
  Tooltip,
  Button,
  Grid,
  CardHeader,
  Card,
  CardContent,
} from '@material-ui/core';
import {
  Header,
  Page,
  Content,
  ContentHeader,
} from '@backstage/core-components';
import { useApi, configApiRef, fetchApiRef } from '@backstage/core-plugin-api';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableContainer from '@material-ui/core/TableContainer';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import Link from '@material-ui/core/Link';
import CheckCircleOutlineIcon from '@material-ui/icons/CheckCircleOutline';
import LinearProgress from '@material-ui/core/LinearProgress';

export const FirelinkComponent = () => {
  // Get Backstage objects
  const config = useApi(configApiRef);
  const fetchApi = useApi(fetchApiRef);



  // Constants
  const backendUrl = config.getString('backend.baseUrl');
  const proxyUrl = `${backendUrl}/api/proxy/ephemeral`;
  const firelinkUrl = config.getString('app.firelink.firelinkUrl');
  const ephemeralUrl = config.getString('app.firelink.ephemeralUrl');

  const [namespaces, setNamespaces] = useState([]);
  const [namespaceReservations, setNamespaceReservations] = useState([]);
  const [namespacesLoading, setNamespacesLoading] = useState(true);
  const [namespaceReservationsLoading, setNamespaceReservationsLoading] =
    useState(true);
  const [error, setError] = useState(null);
  const [showTokenButton, setShowTokenButton] = useState(true);
  const [tokenURL, setTokenURL] = useState('');

  const TruncatedText = ({ text, max }) => {
    if (text.length <= max) {
      return <Typography>{text}</Typography>;
    }

    const truncatedText = text.slice(0, max) + '...';

    return (
      <Tooltip title={text}>
        <Typography style={{ cursor: 'pointer' }}>{truncatedText}</Typography>
      </Tooltip>
    );
  };

  function getEphemeralNamespaces() {
    setNamespacesLoading(true);
    const apiUrl = `${proxyUrl}/api/v1/namespaces`; // Replace with your Kubernetes API server URL
    fetchApi.fetch(apiUrl)
      .then(response => {
        if (!response.ok) {
          setNamespacesLoading(false);
          throw new Error(`Error fetching namespaces: ${response.statusText}`);
        }
        return response.json();
      })
      .then(data => {
        // Filter namespaces prefixed with "ephemeral-"
        const ephemeralNamespaces = data.items.filter(
          namespace =>
            namespace.metadata.name.startsWith('ephemeral-') &&
            !namespace.metadata.name.includes('system'),
        );
        setNamespaces(ephemeralNamespaces);
        console.log(ephemeralNamespaces);
        setNamespacesLoading(false);
      })
      .catch(error => {
        setError(new Error(`Error fetching namespaces: ${error.message}`));
        console.error('Error:', error);
        setNamespacesLoading(false);
      });
  }

  function getNamespaceReservations() {
    setNamespaceReservationsLoading(true);
    const apiUrl = `${proxyUrl}/apis/cloud.redhat.com/v1alpha1/namespacereservations`;
    fetchApi.fetch(apiUrl)
      .then(response => {
        if (!response.ok || !response) {
          throw new Error(
            `Error fetching NamespaceReservations: ${response.statusText}`,
          );
        }
        return response.json();
      })
      .then(data => {
        setNamespaceReservations(data);
        setNamespaceReservationsLoading(false);
      })
      .catch(error => {
        console.error('Error:', error);
        setError(new Error(`Error fetching namespaces: ${error.message}`));
        setNamespaceReservationsLoading(false);
      });
  }

  useEffect(() => {
    getEphemeralNamespaces();
    getNamespaceReservations();
    makeTokenURL();
  }, []);

  const getReservationForNamespace = namespace => {
    return namespaceReservations.items.find(
      reservation => reservation.status.namespace === namespace.metadata.name,
    );
  };

  function convertToLocalTime(isoDateString) {
    const date = new Date(isoDateString);
    return date.toLocaleString();
  }
  const NamespaceRow = ({ namespace }) => {
    if (namespace.status.phase === 'Terminating') {
      return null;
    }
    const reservation = getReservationForNamespace(namespace);
    const reserved = reservation ? true : false;
    return (
      <TableRow>
        <TableCell style={{ flex: 1 }}>
          <Link
            href={`${firelinkUrl}/namespace/describe/${namespace.metadata.name}`}
            target="_blank"
          >
            <Typography> {namespace.metadata.name}</Typography>
          </Link>
        </TableCell>
        <TableCell style={{ flex: 1 }}>
          {reserved ? (
            <CheckCircleOutlineIcon style={{ color: '#00FF11' }} />
          ) : (
            ''
          )}
        </TableCell>
        <TableCell style={{ flex: 1 }}>
          <Typography> {namespace.status.phase}</Typography>{' '}
        </TableCell>
        <TableCell style={{ flex: 1 }}>
          {reserved ? (
            <TruncatedText text={reservation.spec.requester} max={20} />
          ) : (
            ''
          )}
        </TableCell>
        <TableCell style={{ flex: 1 }}>
          {<Typography> {namespace.metadata.labels.pool}</Typography>}
        </TableCell>
        <TableCell style={{ flex: 1 }}>
          {reserved ? convertToLocalTime(reservation.status.expiration) : ''}
        </TableCell>
      </TableRow>
    );
  };

  const refresh = () => {
    setNamespaceReservationsLoading(true);
    setNamespacesLoading(true);
    setError(null);
    getEphemeralNamespaces();
    getNamespaceReservations();
  };

  const reserveNamespace = () => {
    window.open(`${firelinkUrl}/namespace/reserve`, '_blank');
  };

  const makeTokenURL = () => {
    setShowTokenButton(false);
    // Use a regular expression to capture the parts of the URL
    const regex = /^https:\/\/console-([^\.]+)\.apps\.(.*)$/;
    const match = ephemeralUrl.match(regex);

    if (match) {
      const subdomain = match[1];
      const rest = match[2];
      // Replace 'console' with 'oauth' in the subdomain part
      const newSubdomain = subdomain.replace('-console', '');
      setTokenURL(`https://oauth-${newSubdomain}.apps.${rest}/oauth/token/display`);
      setShowTokenButton(true);
    } else {
      console.log(
        'Error: makeTokenURL() - Unable to create token URL from ephemeral URL',
      );
      setShowTokenButton(false);
    }
  };

  const NamespaceTable = () => {
    return (
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell style={{ flex: 1 }}>
                <Typography variant="button">Namespace</Typography>
              </TableCell>
              <TableCell style={{ flex: 1 }}>
                <Typography variant="button">Reserved</Typography>
              </TableCell>
              <TableCell style={{ flex: 1 }}>
                <Typography variant="button">Status</Typography>
              </TableCell>
              <TableCell style={{ flex: 1 }}>
                <Typography variant="button">Requester</Typography>
              </TableCell>
              <TableCell style={{ flex: 1 }}>
                <Typography variant="button">Pool Type</Typography>
              </TableCell>
              <TableCell style={{ flex: 1 }}>
                <Typography variant="button">Expiration</Typography>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {namespaces.map(namespace => (
              <NamespaceRow
                key={namespace.metadata.name}
                namespace={namespace}
              />
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  const ErrorCard = ({ error }) => {
    return (
      <Card variant="outlined">
        <CardHeader title="Error" />
        <CardContent>
          <Typography color="error">{error.message}</Typography>
        </CardContent>
      </Card>
    );
  };

  const ContentPrimaryArea = () => {
    if (error) {
      return <ErrorCard error={error} />;
    }
    if (namespacesLoading || namespaceReservationsLoading) {
      return <LinearProgress />;
    }
    return <NamespaceTable />;
  };

  const TokenButton = () => {
    if (!showTokenButton) {
      return null;
    }
    return (
      <Button href={`${tokenURL}`} target="_blank">
        <Typography variant="button">Get Login Token</Typography>
      </Button>
    );
  };

  return (
    <Page themeId="tool">
      <Header title="Firelink"></Header>
      <Content>
        <ContentHeader title="Ephemeral Namespaces">
          {namespacesLoading || namespaceReservationsLoading ? null : (
            <Button onClick={refresh}>
              <Typography variant="button">Refresh</Typography>
            </Button>
          )}
          <Button onClick={reserveNamespace}>
            <Typography variant="button">Reserve</Typography>
          </Button>
          <Button href={`${firelinkUrl}/apps/deploy`} target="_blank">
            <Typography variant="button">Deploy</Typography>
          </Button>
          <TokenButton />
        </ContentHeader>
        <ContentPrimaryArea />
      </Content>
    </Page>
  );
};
