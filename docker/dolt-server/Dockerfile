# The memory dolt-server image — a dedicated dolt sql-server for AGENT MEMORY,
# fully separate from the Front Desk board mirror. memoryd (the `memory` door)
# and the memory verbs connect to it over the MySQL protocol. A guest-room guest.
FROM dolthub/dolt-sql-server:latest
ENV DB=agent-memory
ENV MEM_USER=mem
COPY entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh
EXPOSE 3306
ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
