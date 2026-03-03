export interface Config {
  app: {
    /**
     * Firelink Plugin Configuration
     * @visibility frontend
     */
    firelink: {
      /**
       * Firelink frontend app URL
       * @visibility frontend
       */
      firelinkUrl: string;
      /**
       * Ephemeral cloud console URL
       * @visibility frontend
       */
      ephemeralUrl: string;
    };
  };
}

